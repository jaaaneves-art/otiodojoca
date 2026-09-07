import { paymentLabels } from '@/lib/espectaculos/presentation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireEventRole } from '@/lib/espectaculos/permissions';
import { positiveId, uuid } from '@/lib/espectaculos/validation';
import { money, orderLabels } from '@/lib/espectaculos/types';
import { RefundForm } from '@/components/espectaculos/refund-form';
export const dynamic = 'force-dynamic';
export default async function FinanceOrder({ params }: { params: Promise<{ id: string; orderId: string }> }) {
  const { id, orderId } = await params; const { db, event } = await requireEventRole(positiveId(id), ['owner', 'admin', 'finance']);
  const { data: order } = await db.from('event_orders').select('id,session_id,status,total_cents,purchase_snapshot,financial_review_required').eq('id', uuid(orderId)).eq('entidade_id', event.entidade_organizadora_id).maybeSingle();
  if (!order) notFound();
  const { data: session } = await db.from('event_sessions').select('id').eq('id', order.session_id).eq('evento_id', event.id).maybeSingle();
  if (!session) notFound();
  const { data: items, error } = await db.from('event_order_items').select('id,name,quantity,unit_price_cents').eq('order_id', order.id);
  if (error) throw new Error('Encomenda indisponível.');
  const { data: tickets, error: ticketError } = items?.length ? await db.from('event_tickets').select('id,status').in('order_item_id', items.map(i => i.id)) : { data: [], error: null };
  if (ticketError) throw new Error('Bilhetes indisponíveis.');
  const { data: payment, error: paymentError } = await db.from('event_payments').select('id,status,amount_cents,application_fee_cents').eq('order_id', order.id).maybeSingle();
  if (paymentError) throw new Error('Pagamento indisponível.');
  const { data: refunds, error: refundError } = payment ? await db.from('event_refunds').select('id,status,amount_cents,reason').eq('payment_id', payment.id).order('created_at') : { data: [], error: null };
  if (refundError) throw new Error('Reembolsos indisponíveis.');
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link href={`/espectaculos/organizador/eventos/${event.id}/encomendas`}>← Encomendas</Link><h1 className="text-2xl font-bold">{event.nome} · {orderLabels[order.status]}</h1><p>Total: {money(order.total_cents)}</p>
    <p>Data na compra: {new Date(order.purchase_snapshot.session_starts_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</p>
    {order.financial_review_required && <p className="rounded bg-amber-50 p-4">Análise financeira necessária. Não foram iniciados reembolsos automáticos.</p>}
    {items?.map(i => <p key={i.id}>{i.quantity} × {i.name} · {money(i.unit_price_cents)}</p>)}
    {payment && <p>Pagamento: {paymentLabels[payment.status]} · Comissão OTJ: {money(payment.application_fee_cents)}</p>}
    {refunds?.map(r => <div key={r.id} className="rounded border p-3">Reembolso: {money(r.amount_cents)} · {paymentLabels[r.status]}<p>{r.reason}</p></div>)}
    {payment && ['succeeded', 'review'].includes(payment.status) && order.status !== 'refunded' && <RefundForm orderId={order.id} tickets={tickets ?? []} reviewWithoutTickets={order.status === 'review' && !tickets?.length} />}
  </main>;
}
