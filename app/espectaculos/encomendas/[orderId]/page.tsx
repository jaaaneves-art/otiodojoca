import Link from 'next/link';
import { ownOrder } from '@/lib/espectaculos/queries';
import { money, orderLabels } from '@/lib/espectaculos/types';
import { confirmFree } from '@/lib/espectaculos/actions';
import { OrderRefresh } from '@/components/espectaculos/order-status';
import { qrConfigured } from '@/lib/espectaculos/qr';
export const dynamic = 'force-dynamic';
export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params; const { db, order, observedAt } = await ownOrder(orderId);
  const { data: items, error } = await db.from('event_order_items').select('id,name,quantity,unit_price_cents').eq('order_id', order.id);
  if (error) throw new Error('Não foi possível carregar os bilhetes.');
  const { data: tickets, error: ticketsError } = items?.length ? await db.from('event_tickets').select('id,status,order_item_id').in('order_item_id', items.map(i => i.id)) : { data: [], error: null };
  if (ticketsError) throw new Error('Não foi possível carregar os bilhetes.');
  const pending = ['reserved', 'payment_pending'].includes(order.status);
  const unexpired = Date.parse(order.expires_at) > observedAt;
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link href="/espectaculos/encomendas">← Encomendas</Link>
    <h1 className="text-2xl font-bold">{order.purchase_snapshot.event_name}</h1><p className="font-semibold">{orderLabels[order.status]} · {money(order.total_cents)}</p>
    <p>Condições na compra: {new Date(order.purchase_snapshot.session_starts_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })} · {order.purchase_snapshot.place}</p>
    {items?.map(i => <p key={i.id}>{i.quantity} × {i.name} · {money(i.unit_price_cents)}</p>)}
    {order.financial_review_required && <p className="rounded bg-amber-50 p-4">Esta encomenda requer análise do organizador. A entrada pode estar suspensa.</p>}
    {pending && <p>Prazo inicial da reserva: {new Date(order.expires_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}. {unexpired ? '' : 'O prazo terminou. Se iniciaste um pagamento, aguarda a sua reconciliação.'}</p>}
    {order.status === 'reserved' && unexpired && order.total_cents === 0 && (qrConfigured() ? <form action={confirmFree}><input type="hidden" name="order_id" value={order.id} /><button className="rounded bg-rose-600 px-4 py-2 text-white">Confirmar bilhetes gratuitos</button></form> : <p>A emissão de bilhetes ainda não está disponível.</p>)}
    {pending && unexpired && order.total_cents > 0 && <Link className="inline-block rounded bg-rose-600 px-4 py-2 text-white" href={`/espectaculos/checkout/${order.id}`}>Continuar para pagamento</Link>}
    {tickets?.map(t => <Link className="block rounded border p-4" key={t.id} href={`/espectaculos/bilhetes/${t.id}`}>Ver bilhete · {t.status === 'valid' ? 'Válido' : t.status === 'used' ? 'Utilizado' : 'Reembolso / cancelamento'}</Link>)}
    <OrderRefresh pending={pending} /><p className="text-sm text-slate-500">Este documento não é uma fatura. O regresso do pagamento não confirma a compra; aguarda a confirmação nesta página.</p>
  </main>;
}
