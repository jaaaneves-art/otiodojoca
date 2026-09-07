import Link from 'next/link';
import { ownOrder } from '@/lib/espectaculos/queries';
import { stripeConfigured } from '@/lib/espectaculos/payments';
import { PaymentForm } from '@/components/espectaculos/payment-form';
import { OrderSummary } from '@/components/espectaculos/order-summary';
import { ReservationClock } from '@/components/espectaculos/reservation-clock';
import { OrderRefresh } from '@/components/espectaculos/order-status';
import { checkoutState } from '@/lib/espectaculos/presentation';
export const dynamic = 'force-dynamic';
export default async function Checkout({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params; const { db, order, observedAt } = await ownOrder(orderId);
  const { data: items, error } = await db.from('event_order_items').select('id,name,quantity,unit_price_cents').eq('order_id', order.id);
  if (error) throw new Error('Não foi possível carregar o resumo.');
  const state = checkoutState(order, observedAt);
  return <main className="mx-auto max-w-xl space-y-5 p-5"><Link href={`/espectaculos/encomendas/${order.id}`}>← Encomenda e bilhetes</Link><h1 className="text-2xl font-bold">Concluir compra</h1><OrderSummary order={order} items={items ?? []} /><p role="status">{state.message}</p>
    {state.payable && <ReservationClock expiresAt={order.expires_at} observedAt={observedAt} />}
    {state.payable && order.total_cents > 0 && (stripeConfigured() ? <PaymentForm orderId={order.id} expiresAt={order.expires_at} /> : <p>Pagamentos online temporariamente indisponíveis.</p>)}
    {state.payable && order.total_cents === 0 && <Link href={`/espectaculos/encomendas/${order.id}`}>Confirmar registo gratuito na encomenda</Link>}
    <OrderRefresh pending={['reserved', 'payment_pending'].includes(order.status)} /><p className="text-sm">A compra fica confirmada quando recebermos a confirmação do pagamento. Esta página não é uma fatura.</p>
  </main>;
}
