'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { ownOrder } from './queries';
import { requireEventRole, signedIn } from './permissions';
import { selection, positiveId, uuid } from './validation';
import { ensureIntent, loadPayment, sendRefund, stripeConfigured } from './payments';
import { qrConfigured } from './qr';
import { tokenHash } from './qr-crypto';

export async function reserveOrder(form: FormData) {
  const { db } = await signedIn();
  const { data, error } = await db.rpc('event_reserve', { p_session: positiveId(form.get('session_id')), p_items: selection(form), p_key: uuid(form.get('idempotency_key')) });
  if (error) throw new Error('Não foi possível reservar. Verifica a disponibilidade e os limites por encomenda.');
  redirect(`/espectaculos/encomendas/${data}`);
}
export async function confirmFree(form: FormData) {
  const { db, order } = await ownOrder(uuid(form.get('order_id')));
  if (!qrConfigured()) throw new Error('A emissão de bilhetes ainda não está configurada.');
  const { error } = await db.rpc('event_confirm_free', { p_order: order.id });
  if (error) throw new Error('A reserva expirou ou já não pode ser confirmada.');
  revalidatePath(`/espectaculos/encomendas/${order.id}`);
}
export async function startPayment(form: FormData): Promise<{ clientSecret: string } | { error: string }> {
  try {
    const { order, user } = await ownOrder(uuid(form.get('order_id')));
    if (!stripeConfigured() || !qrConfigured()) return { error: 'Pagamentos online ainda indisponíveis.' };
    if (order.financial_review_required) return { error: 'Encomenda em revisão manual. Aguarda o contacto do organizador.' };
    if (order.status !== 'reserved' && order.status !== 'payment_pending') return { error: 'Encomenda indisponível para pagamento.' };
    if (Date.parse(order.expires_at) <= Date.now()) return { error: 'O prazo da reserva terminou. Aguarda a reconciliação do pagamento.' };
    const { data, error } = await createAdminClient().rpc('event_prepare_payment', { p_order: order.id, p_buyer: user.id });
    if (error) return { error: 'Pagamentos ainda não disponíveis para este organizador.' };
    const intent = await ensureIntent(await loadPayment(data));
    if (!intent.client_secret || ['succeeded', 'canceled'].includes(intent.status)) return { error: 'Consulta o estado atualizado da encomenda.' };
    return { clientSecret: intent.client_secret };
  } catch { return { error: 'Não foi possível iniciar o pagamento. Podes voltar a tentar nesta encomenda.' }; }
}
export async function requestRefund(form: FormData) {
  const { db } = await signedIn();
  const orderId = uuid(form.get('order_id'));
  const { data, error } = await db.rpc('event_request_refund', { p_order: orderId,
    p_tickets: form.getAll('ticket_id').map(uuid), p_reason: String(form.get('reason') ?? '').trim(),
    p_key: uuid(form.get('idempotency_key')), p_reverse: form.get('reverse_transfer') === 'on', p_refund_fee: form.get('refund_fee') === 'on' });
  if (error) throw new Error('Pedido recusado. Verifica as permissões, os bilhetes e o montante.');
  if (stripeConfigured()) { try { await sendRefund(data); } catch { /* Durable requested state is retried by maintenance. */ } }
  revalidatePath('/espectaculos/organizador', 'layout');
}
export async function changeEventStatus(form: FormData) {
  const id = positiveId(form.get('event_id'));
  const status = String(form.get('status'));
  if (!['publicado', 'cancelado'].includes(status)) throw new Error('Estado inválido.');
  const { db } = await requireEventRole(id, ['owner', 'admin', 'manager']);
  const { error } = await db.from('eventos').update({ estado: status }).eq('id', id);
  if (error) throw new Error('Não foi possível alterar o estado.');
  revalidatePath(`/espectaculos/organizador/eventos/${id}`);
  revalidatePath('/espectaculos');
}
export async function cancelSession(form: FormData) {
  const id = positiveId(form.get('event_id'));
  const { db } = await requireEventRole(id, ['owner', 'admin', 'manager']);
  const { error } = await db.from('event_sessions').update({ status: 'cancelled', sales_enabled: false }).eq('id', positiveId(form.get('session_id'))).eq('evento_id', id);
  if (error) throw new Error('Não foi possível cancelar a sessão.');
  revalidatePath(`/espectaculos/organizador/eventos/${id}`, 'layout');
}
export async function checkIn(session: number, token: string, request: string) {
  try {
    const { db } = await signedIn();
    let hash: string;
    try { hash = tokenHash(token); } catch { return { result: 'invalid' }; }
    const { data, error } = await db.rpc('event_checkin_feedback', { p_session: positiveId(session), p_hash: hash, p_request: uuid(request) });
    if (error) return { result: 'error' };
    return { result: typeof data?.result === 'string' ? data.result : 'error', replayed: data?.replayed === true };
  } catch { return { result: 'error' }; }
}

export async function updateTicketInventory(form: FormData) {
  const eventId = positiveId(form.get('event_id'));
  const { db } = await requireEventRole(eventId, ['owner', 'admin', 'manager']);
  const sessionId = positiveId(form.get('session_id'));
  const { data: session } = await db.from('event_sessions').select('id').eq('id', sessionId).eq('evento_id', eventId).maybeSingle();
  if (!session) throw new Error('Sessão indisponível.');
  const quantity = positiveId(form.get('quantity'));
  const maxRaw = String(form.get('max_per_order') ?? '').trim();
  const { cents } = await import('./validation');
  const { portugalLocalToUtc } = await import('@/lib/portugal-datetime');
  const start = String(form.get('sales_start') ?? '').trim();
  const end = String(form.get('sales_end') ?? '').trim();
  const { error } = await db.from('event_ticket_types').update({ quantity,
    price_cents: cents(form.get('price')), max_per_order: maxRaw ? positiveId(maxRaw) : null,
    active: form.get('active') === 'on', sales_start: start ? portugalLocalToUtc(start).toISOString() : null,
    sales_end: end ? portugalLocalToUtc(end).toISOString() : null,
  }).eq('id', positiveId(form.get('ticket_type_id'))).eq('session_id', sessionId);
  if (error) throw new Error('Não foi possível atualizar. O stock comprometido e as datas têm de ser respeitados.');
  revalidatePath(`/espectaculos/organizador/eventos/${eventId}`, 'layout');
  revalidatePath('/espectaculos');
}
export async function updateSessionCapacity(form: FormData) {
  const eventId = positiveId(form.get('event_id'));
  const { db } = await requireEventRole(eventId, ['owner', 'admin', 'manager']);
  const { error } = await db.from('event_sessions').update({ capacity: positiveId(form.get('capacity')) })
    .eq('id', positiveId(form.get('session_id'))).eq('evento_id', eventId);
  if (error) throw new Error('Capacidade inválida ou inferior ao stock comprometido.');
  revalidatePath(`/espectaculos/organizador/eventos/${eventId}`, 'layout');
  revalidatePath('/espectaculos');
}
