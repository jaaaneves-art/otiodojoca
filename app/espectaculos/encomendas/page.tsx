import Link from 'next/link';
import { signedIn } from '@/lib/espectaculos/permissions';
import { money, orderLabels } from '@/lib/espectaculos/types';
export const dynamic = 'force-dynamic';
export default async function Orders() {
  const { db, user } = await signedIn();
  const { data, error } = await db.from('event_orders').select('id,status,total_cents,purchase_snapshot,created_at').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Não foi possível carregar as encomendas.');
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link href="/espectaculos">← Espetáculos</Link><h1 className="text-2xl font-bold">As minhas encomendas</h1>
    {!data?.length && <p>Ainda não tens encomendas.</p>}{data?.map(o => <Link key={o.id} href={`/espectaculos/encomendas/${o.id}`} className="block rounded border p-4">{o.purchase_snapshot.event_name} · {money(o.total_cents)} · {orderLabels[o.status]}</Link>)}
  </main>;
}
