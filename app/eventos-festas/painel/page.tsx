import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getManaged } from '@/lib/eventos-festas/data';
import { Unavailable } from '@/components/eventos-festas/directory';
export const metadata = { title: 'A minha empresa', robots: { index: false } };
export default async function Page() {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=/eventos-festas/painel');
  const [empresas, { data: admin }] = await Promise.all([getManaged(), db.rpc('eventos_festas_admin')]);
  if (!empresas) return <Unavailable />;
  return <><h1 className="text-3xl font-bold">As minhas empresas</h1><p className="mt-3 text-stone-600">Uma entidade, vários serviços. Gira a sua presença em Eventos & Festas.</p><Link href="/eventos-festas/aderir" className="mt-6 inline-block rounded-xl bg-rose-800 px-5 py-3 font-semibold text-white">Adicionar a minha empresa</Link>{admin && <Link href="/eventos-festas/administracao" className="ml-4 inline-block py-3 underline">Moderação</Link>}<div className="mt-8 grid gap-4 sm:grid-cols-2">{empresas.map(e => <article className="rounded-2xl border bg-white p-5" key={e.id}><h2 className="text-xl font-semibold">{e.nome}</h2><p className="my-3 text-sm">{e.estado ?? 'Sem presença em Eventos & Festas'} · {e.verificada ? 'Verificada' : 'Ainda não verificada'}</p><Link href={`/eventos-festas/painel/${e.id}`} className="text-rose-800 underline">{e.estado ? 'Gerir presença' : 'Ativar presença'}</Link></article>)}</div>{!empresas.length && <p className="mt-6">Ainda não gere nenhuma entidade.</p>}</>;
}
