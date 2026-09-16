import { notFound } from 'next/navigation';
import { Directory, Unavailable } from '@/components/eventos-festas/directory';
import { getCatalogs } from '@/lib/eventos-festas/data';
import type { SearchParams } from '@/lib/eventos-festas/types';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params }: Props) { const { slug } = await params; const c = await getCatalogs(); return { title: c?.servicos.find(t => t.slug === slug)?.nome ?? c?.categorias.find(t => t.slug === slug)?.nome ?? 'Serviços' }; }
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params; const c = await getCatalogs(); if (!c) return <Unavailable />;
  const s = c.servicos.find(t => t.slug === slug); const cat = c.categorias.find(t => t.slug === slug);
  if (!s && !cat) notFound();
  return <Directory title={(s ?? cat)!.nome} description={s?.nota ?? undefined} params={{ ...await searchParams, ...(s ? { servico: slug } : { categoria: slug }) }} />;
}
