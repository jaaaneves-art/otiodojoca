import Link from 'next/link';
import { getCatalogs } from '@/lib/eventos-festas/data';
import { Unavailable } from '@/components/eventos-festas/directory';
export const metadata = { title: 'Serviços para eventos' };
export default async function Page() {
  const c = await getCatalogs(); if (!c) return <Unavailable />;
  return <><h1 className="text-3xl font-bold">Serviços para todos os momentos</h1><p className="mt-3 text-stone-600">Explore as especialidades e encontre profissionais.</p><div className="mt-8 grid items-start gap-5 md:grid-cols-2">{c.categorias.map(cat => <details key={cat.slug} className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer text-lg font-semibold">{cat.nome}</summary><Link href={`/eventos-festas/categorias/${cat.slug}`} className="my-4 block text-rose-800 underline">Ver todos os profissionais</Link><ul className="space-y-3">{c.servicos.filter(s => c.relacoes.some(r => r.categoria_slug === cat.slug && r.servico_slug === s.slug)).map(s => <li key={s.slug}><Link href={`/eventos-festas/servicos/${s.slug}`} className="hover:underline">{s.nome}</Link></li>)}</ul></details>)}</div></>;
}
