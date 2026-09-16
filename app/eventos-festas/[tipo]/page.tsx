import { notFound } from 'next/navigation';
import { Directory, Unavailable } from '@/components/eventos-festas/directory';
import { getCatalogs } from '@/lib/eventos-festas/data';
import type { SearchParams } from '@/lib/eventos-festas/types';
type Props = { params: Promise<{ tipo: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params }: Props) { const { tipo } = await params; const c = await getCatalogs(); return { title: c?.tipos.find(t => t.slug === tipo)?.nome ?? 'Tipos de evento' }; }
export default async function Page({ params, searchParams }: Props) {
  const { tipo } = await params; const catalogs = await getCatalogs();
  if (!catalogs) return <Unavailable />;
  const item = catalogs.tipos.find(t => t.slug === tipo); if (!item) notFound();
  return <Directory title={item.nome} description={tipo === 'despedidas' ? 'Despedidas de solteiro, solteira, grupos mistos ou uma despedida de casado: encontre profissionais para organizar a celebração.' : `Encontre espaços e profissionais para ${item.nome.toLocaleLowerCase('pt-PT')}. Combine serviços e localização para preparar o seu evento.`} params={{ ...await searchParams, tipo }} />;
}
