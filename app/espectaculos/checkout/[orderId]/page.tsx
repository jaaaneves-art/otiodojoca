import Link from 'next/link';
import { ownOrder } from '@/lib/espectaculos/queries';
import { stripeConfigured } from '@/lib/espectaculos/payments';
import { PaymentForm } from '@/components/espectaculos/payment-form';
import { money } from '@/lib/espectaculos/types';
export const dynamic = 'force-dynamic';
export default async function Checkout({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params; const { order } = await ownOrder(orderId);
  return <main className="mx-auto max-w-xl space-y-5 p-6"><Link href={`/espectaculos/encomendas/${order.id}`}>← Encomenda</Link><h1 className="text-2xl font-bold">Pagamento · {money(order.total_cents)}</h1>
    {stripeConfigured() ? <PaymentForm orderId={order.id} /> : <p>Pagamentos online ainda indisponíveis. A integração aguarda configuração e validação.</p>}
  </main>;
}
