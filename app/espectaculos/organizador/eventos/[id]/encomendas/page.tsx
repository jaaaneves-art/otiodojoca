import Link from 'next/link';
import { requireEventRole } from '@/lib/espectaculos/permissions';
import { positiveId } from '@/lib/espectaculos/validation';
import { money, orderLabels } from '@/lib/espectaculos/types';
export const dynamic = 'force-dynamic';
export default async function EventOrders({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { db, event } = await requireEventRole(positiveId(id), ['owner', 'admin', 'finance']);
  const { data: sessions, error: sessionsError } = await db.from('event_sessions').select('id').eq('evento_id', event.id);
  if (sessionsError) throw new Error('Não foi possível carregar as sessões.');
  const { data: orders, error } = sessions?.length ? await db.from('event_orders').select('id,status,total_cents,financial_review_required,purchase_snapshot,created_at').in('session_id', sessions.map(s => s.id)).order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
  if (error) throw new Error('Não foi possível carregar as encomendas.');
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link href={`/espectaculos/organizador/eventos/${event.id}`}>← Espetáculo</Link><h1 className="text-2xl font-bold">Encomendas · {event.nome}</h1>{!orders?.length && <p>Sem encomendas.</p>}{orders?.map(o => <Link className="block rounded border p-4" key={o.id} href={`/espectaculos/organizador/eventos/${event.id}/encomendas/${o.id}`}>{new Date(o.purchase_snapshot.session_starts_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}<span className="block">{orderLabels[o.status]}</span> · {money(o.total_cents)} {o.financial_review_required && '· Análise necessária'}</Link>)}</main>;
}
