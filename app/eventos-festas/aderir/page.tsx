import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCatalogs, getManaged } from '@/lib/eventos-festas/data';
import { CompanyForm, ClaimForm } from '@/components/eventos-festas/company-form';
import { Unavailable } from '@/components/eventos-festas/directory';
import { one } from '@/lib/eventos-festas/validation';
import type { SearchParams } from '@/lib/eventos-festas/types';
export const metadata = { title: 'Adicionar a minha empresa', robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=/eventos-festas/aderir');
  const [catalogs, managed, params] = await Promise.all([getCatalogs(), getManaged(), searchParams]);
  if (!catalogs || !managed) return <Unavailable />;
  const term = one(params.procurar).trim().slice(0, 100);
  const { data: existing } = term.length >= 2 ? await db.from('entidades').select('slug,nome').eq('estado', 'publicado').ilike('nome', `%${term.replace(/[%_\\]/g, '')}%`).limit(12) : { data: [] };
  return <><h1 className="text-3xl font-bold">Adicionar a minha empresa</h1><p className="mt-3 max-w-2xl text-stone-600">Ative Eventos & Festas na empresa que já gere no OTJ. Se ainda não tem acesso, pode pedi-lo à equipa.</p>
    <section className="mt-8 rounded-2xl border bg-white p-5"><h2 className="text-xl font-semibold">Escolher uma entidade que já gere</h2>{managed.length ? <ul className="mt-4 space-y-3">{managed.map(e => <li key={e.id}><Link href={`/eventos-festas/painel/${e.id}`} className="font-medium text-rose-800 underline">{e.nome} — {e.estado ? 'Gerir presença' : 'Ativar Eventos & Festas'}</Link></li>)}</ul> : <p className="mt-3 text-stone-600">Ainda não tem entidades com acesso de gestão.</p>}</section>
    <section className="mt-6 rounded-2xl border bg-white p-5"><h2 className="text-xl font-semibold">A empresa já está no OTJ?</h2><form className="mt-4 flex flex-wrap gap-3"><label className="min-w-0 flex-1">Nome da empresa<input name="procurar" defaultValue={term} minLength={2} maxLength={100} className="mt-1 w-full rounded-lg border px-3 py-3" /></label><button className="self-end rounded-lg bg-stone-100 px-4 py-3">Procurar entidade</button></form>
      {term && <ul className="mt-4 space-y-3">{existing?.map(e => <li key={e.slug} className="rounded-lg border p-3"><p className="font-semibold">{e.nome}</p><details><summary className="mt-2 cursor-pointer text-sm text-rose-800">Pedir acesso a esta entidade</summary><ClaimForm slug={e.slug} /></details></li>)}{!existing?.length && <li>Nenhuma entidade pública encontrada com este nome.</li>}</ul>}
    </section>
    <details className="mt-8 rounded-2xl border border-rose-200 p-5"><summary className="cursor-pointer text-xl font-semibold">A minha empresa ainda não existe no OTJ</summary><p className="mt-4 text-stone-600">Crie a entidade uma única vez. Poderá usar a mesma empresa noutros módulos.</p><CompanyForm catalogs={catalogs} /></details>
  </>;
}
