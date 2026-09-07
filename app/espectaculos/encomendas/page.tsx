import Link from 'next/link';
import { signedIn } from '@/lib/espectaculos/permissions';
import { money, orderLabels } from '@/lib/espectaculos/types';
export const dynamic = 'force-dynamic';
export default async function Orders({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { pagina } = await searchParams;
  const page = /^\d{1,5}$/.test(pagina ?? '') ? Math.max(1, Number(pagina)) : 1;
  const { db, user } = await signedIn();
  const { data, error, count } = await db.from('event_orders').select('id,status,total_cents,purchase_snapshot,created_at', { count: 'exact' }).eq('buyer_id', user.id).order('created_at', { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error('Não foi possível carregar as encomendas.');
  return <main className="mx-auto max-w-3xl space-y-5 p-6"><Link href="/espectaculos">← Espetáculos</Link><h1 className="text-2xl font-bold">As minhas encomendas</h1>
    {!data?.length && <p>Sem encomendas nesta página.</p>}{data?.map(o => <Link key={o.id} href={`/espectaculos/encomendas/${o.id}`} className="block rounded border p-4">{o.purchase_snapshot.event_name}<span className="block text-sm">{new Date(o.created_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</span> {money(o.total_cents)} · {orderLabels[o.status]}</Link>)}
    <nav aria-label="Páginas de encomendas" className="flex justify-between gap-4">{page > 1 && <Link href={`?pagina=${page - 1}`}>← Anteriores</Link>}{page * 25 < (count ?? 0) && <Link href={`?pagina=${page + 1}`}>Seguintes →</Link>}</nav>
  </main>;
}
