import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getEmpresa } from '@/lib/eventos-festas/data';
import { safeWebsite, safePortfolioImage } from '@/lib/eventos-festas/validation';
import { Unavailable } from '@/components/eventos-festas/directory';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { const { slug } = await params; const { empresa } = await getEmpresa(slug); return { title: empresa?.nome ?? 'Profissional', description: empresa?.descricao?.slice(0, 160) }; }
export default async function Page({ params }: Props) {
  const { slug } = await params; const { empresa: e, unavailable } = await getEmpresa(slug);
  if (unavailable) return <Unavailable />; if (!e) notFound();
  const photos = (e.fotografias ?? []).filter(url => safePortfolioImage(url, process.env.NEXT_PUBLIC_SUPABASE_URL)).slice(0, 12);
  const website = safeWebsite(e.website);
  return <>
    <Link href="/eventos-festas/empresas" className="text-sm text-rose-800 underline">← Profissionais</Link>
    {photos[0] && <div className="relative mt-6 h-56 overflow-hidden rounded-3xl sm:h-80"><Image src={photos[0]} alt={e.nome} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 1100px" /></div>}
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0"><p className="text-sm text-rose-800">Presença ativa · {e.verificada ? 'Empresa verificada' : 'Empresa ainda não verificada'}</p><h1 className="mt-2 break-words text-4xl font-bold">{e.nome}</h1>
        <p className="mt-3 text-stone-600">{[e.localidade || e.freguesia, e.regiao || e.concelho, e.pais_codigo].filter(Boolean).join(' · ')}</p>
        <p className="mt-6 whitespace-pre-line break-words leading-relaxed">{e.descricao}</p>
        <section className="mt-8"><h2 className="text-xl font-bold">Serviços</h2><ul className="mt-4 flex flex-wrap gap-2">{e.servicos.map(s => <li key={s.slug}><Link href={`/eventos-festas/servicos/${s.slug}`} className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-950">{s.nome}</Link>{s.nota && <p className="mt-1 max-w-sm px-2 text-xs text-stone-600">{s.nota}</p>}</li>)}</ul></section>
        <section className="mt-8"><h2 className="text-xl font-bold">Tipos de evento</h2><ul className="mt-4 flex flex-wrap gap-2">{e.tipos.map(t => <li key={t.slug}><Link href={`/eventos-festas/${t.slug}`} className="inline-block rounded-full border border-stone-300 bg-white px-4 py-2 text-sm">{t.nome}</Link></li>)}</ul></section>
      </div>
      <aside className="h-fit min-w-0 rounded-2xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-bold">Fale com a empresa</h2><div className="mt-5 space-y-4 break-words text-sm">
        {e.telefone && <p><a className="underline" href={`tel:${e.telefone.replace(/[^+\d]/g, '')}`}>{e.telefone}</a></p>}
        {e.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email) && <p><a className="underline" href={`mailto:${e.email}`}>{e.email}</a></p>}
        {website && <p><a className="underline" href={website} target="_blank" rel="noopener noreferrer">Visitar website</a></p>}
        {Object.entries(e.redes_sociais ?? {}).filter(([, url]) => safeWebsite(url)).map(([label, url]) => <p key={label}><a href={safeWebsite(url)} target="_blank" rel="noopener noreferrer" className="capitalize underline">{label}</a></p>)}
        {!e.telefone && !e.email && !website && <p>Contactos públicos ainda não disponibilizados.</p>}
        {e.capacidade && <p><strong>Capacidade:</strong> até {e.capacidade} pessoas</p>}
        {e.lugar && <p><strong>Localização:</strong> {e.lugar}</p>}
        {e.area_servico && <p><strong>Área de serviço:</strong> {e.area_servico}</p>}
      </div></aside>
    </div>
    {photos.length > 1 && <section className="mt-10"><h2 className="text-2xl font-bold">Portefólio</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.slice(1).map((photo, index) => <div key={`${photo}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={photo} alt={`Trabalho de ${e.nome} — ${index + 1}`} fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" /></div>)}</div></section>}
  </>;
}
