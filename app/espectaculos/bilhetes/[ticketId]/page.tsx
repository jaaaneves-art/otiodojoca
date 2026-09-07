import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { signedIn } from '@/lib/espectaculos/permissions';
import { uuid } from '@/lib/espectaculos/validation';
import { renderTicketQR } from '@/lib/espectaculos/qr';
import { PrintTicket } from '@/components/espectaculos/print-ticket';
export const dynamic = 'force-dynamic';
export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params; const { db, user } = await signedIn();
  const { data: ticket } = await db.from('event_tickets').select('id,status,order_item_id,key_version').eq('id', uuid(ticketId)).maybeSingle();
  if (!ticket) notFound();
  const { data: item } = await db.from('event_order_items').select('order_id,name').eq('id', ticket.order_item_id).single();
  if (!item) notFound();
  const { data: order } = await db.from('event_orders').select('id,purchase_snapshot,financial_review_required').eq('id', item.order_id).eq('buyer_id', user.id).maybeSingle();
  if (!order) notFound();
  const usable = ticket.status === 'valid' && !order.financial_review_required;
  const qr = usable ? await renderTicketQR(ticket.id, user.id, ticket.key_version) : null;
  return <main className="mx-auto max-w-xl space-y-5 p-6 text-center"><Link className="print:hidden" href={`/espectaculos/encomendas/${order.id}`}>← Encomenda</Link><h1 className="text-2xl font-bold">{order.purchase_snapshot.event_name}</h1><p>{item.name} · Bilhete não nominativo</p>
    <p>{new Date(order.purchase_snapshot.session_starts_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</p>
    {qr ? <><div className="flex justify-center"><Image unoptimized src={qr} alt="QR de entrada do bilhete" width={320} height={320} /></div><PrintTicket /></> : <p>{usable ? 'QR ainda indisponível. A emissão aguarda configuração.' : 'Este bilhete não está disponível para entrada.'}</p>}
    <p className="text-sm">Uma entrada por bilhete. Guarda o QR em segurança. Este bilhete não é uma fatura.</p>
  </main>;
}
