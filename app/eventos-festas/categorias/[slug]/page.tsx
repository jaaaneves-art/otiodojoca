import { notFound } from 'next/navigation';
import { Directory, Unavailable } from '@/components/eventos-festas/directory';
import { getCatalogs } from '@/lib/eventos-festas/data';
import type { SearchParams } from '@/lib/eventos-festas/types';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params }: Props) { const { slug } = await params; const c = await getCatalogs(); return { title: c?.categorias.find(t => t.slug === slug)?.nome ?? 'Categorias' }; }
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params; const c = await getCatalogs(); if (!c) return <Unavailable />;
  const item = c.categorias.find(t => t.slug === slug); if (!item) notFound();
  return <Directory title={item.nome} params={{ ...await searchParams, categoria: slug }} />;
}
