import Link from 'next/link';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { getCatalogs } from '@/lib/eventos-festas/data';
import { Unavailable } from '@/components/eventos-festas/directory';
export default async function Page() {
  const catalogs = await getCatalogs();
  return <>
    <section className="rounded-3xl bg-rose-950 px-6 py-12 text-white sm:px-12 sm:py-16">
      <p className="flex items-center gap-2 text-sm text-rose-200"><Sparkles size={18} aria-hidden="true" />Momentos especiais começam com boas escolhas</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">A sua celebração.<br />Os profissionais certos.</h1>
      <p className="mt-6 max-w-xl text-lg text-rose-100">Espaços, sabores, música e todos os detalhes para organizar casamentos, festas e eventos. Perto de si, em Portugal e pelo mundo.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/eventos-festas/empresas" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-rose-950">Encontrar profissionais<ArrowRight size={18} aria-hidden="true" /></Link><Link href="/eventos-festas/aderir" className="rounded-xl border border-rose-300 px-5 py-3 font-semibold">Adicionar a minha empresa</Link></div>
    </section>
    {!catalogs ? <div className="mt-10"><Unavailable /></div> : <>
      <section className="mt-12"><h2 className="text-2xl font-bold">O que vamos celebrar?</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{catalogs.tipos.filter(t => !t.grupo_slug).map(t => <Link key={t.slug} href={`/eventos-festas/${t.slug}`} className="rounded-2xl border border-rose-100 bg-white p-6 font-semibold hover:border-rose-400"><Heart size={20} className="mb-4 text-rose-700" aria-hidden="true" />{t.nome}<span className="mt-3 block text-sm font-normal text-stone-600">Descobrir fornecedores →</span></Link>)}</div></section>
      <section className="mt-12"><h2 className="text-2xl font-bold">Cada detalhe, um especialista</h2><p className="mt-2 text-stone-600">Junte os serviços de que precisa para o seu dia.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{catalogs.categorias.map(c => <Link href={`/eventos-festas/categorias/${c.slug}`} key={c.slug} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-rose-400">{c.nome} <span aria-hidden="true">→</span></Link>)}</div></section>
    </>}
  </>;
}
