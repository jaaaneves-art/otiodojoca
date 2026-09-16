import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCatalogs, getManaged } from '@/lib/eventos-festas/data';
import { CompanyForm } from '@/components/eventos-festas/company-form';
import { Unavailable } from '@/components/eventos-festas/directory';
import { positiveInteger } from '@/lib/eventos-festas/validation';
import type { SearchParams } from '@/lib/eventos-festas/types';
export const metadata = { title: 'Gerir presença', robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const { id } = await params; if (!positiveInteger(id)) notFound();
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/eventos-festas/painel/${id}`);
  const [c, managed, query] = await Promise.all([getCatalogs(), getManaged(), searchParams]);
  if (!c || !managed) return <Unavailable />;
  const e = managed.find(e => e.id === Number(id)); if (!e) notFound();
  return <><Link href="/eventos-festas/painel" className="text-sm underline">← As minhas empresas</Link><h1 className="mt-4 text-3xl font-bold">{e.nome}</h1><p className="mt-3">Estado: {e.estado ?? 'Por ativar'} · {e.verificada ? 'Empresa verificada' : 'Empresa ainda não verificada'}</p>
    {query.guardado && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-900">Dados guardados. {e.estado === 'pendente' ? 'A presença aguarda análise da equipa OTJ.' : ''}</p>}
    {e.estado === 'ativo' && e.estado_entidade === 'publicado' && <Link href={`/eventos-festas/empresas/${e.slug}`} className="mt-4 inline-block text-rose-800 underline">Ver perfil público</Link>}
    {e.estado === 'suspenso' ? <p className="mt-6">A presença foi suspensa. Contacte a equipa OTJ para pedir revisão.</p> : <CompanyForm catalogs={c} empresa={e} />}
  </>;
}
