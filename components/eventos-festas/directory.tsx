import Link from 'next/link';
import { MapPin, Users, BadgeCheck } from 'lucide-react';
import { getCatalogs, searchEmpresas } from '@/lib/eventos-festas/data';
import { one, positiveInteger } from '@/lib/eventos-festas/validation';
import type { EmpresaPublica, SearchParams } from '@/lib/eventos-festas/types';
export function Unavailable() { return <div role="status" className="rounded-2xl border border-rose-200 bg-white p-6"><h2 className="text-xl font-semibold">Diretório temporariamente indisponível</h2><p className="mt-2">Tente novamente mais tarde.</p><Link href="/eventos-festas" className="mt-4 inline-block underline">Voltar a Eventos & Festas</Link></div>; }
export function EmpresaCard({ empresa: e }: { empresa: EmpresaPublica }) {
  return <article className="flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-rose-800">{e.servicos[0]?.nome ?? 'Profissional de eventos'}</p>
    <h2 className="break-words text-xl font-bold"><Link className="hover:underline" href={`/eventos-festas/empresas/${e.slug}`}>{e.nome}</Link></h2>
    <p className="mt-2 flex items-start gap-2 text-sm text-stone-600"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{[e.localidade || e.freguesia, e.regiao || e.concelho, e.pais_codigo].filter(Boolean).join(' · ')}</p>
    <p className="my-4 line-clamp-3 text-sm text-stone-700">{e.descricao || 'Conheça os serviços deste profissional.'}</p>
    {e.capacidade && <p className="mb-3 flex items-center gap-2 text-sm"><Users size={16} aria-hidden="true" />Até {e.capacidade} pessoas</p>}
    <p className="mt-auto flex items-center gap-1 text-xs">{e.verificada ? <><BadgeCheck size={16} className="text-emerald-700" aria-hidden="true" />Empresa verificada</> : 'Empresa ainda não verificada'}</p>
    <Link href={`/eventos-festas/empresas/${e.slug}`} className="mt-4 text-sm font-semibold text-rose-800">Conhecer profissional →</Link>
  </article>;
}
export async function Directory({ params, title = 'Encontre os profissionais para o seu evento', description }: { params: SearchParams; title?: string; description?: string }) {
  const [catalogs, empresas] = await Promise.all([getCatalogs(), searchEmpresas(params)]);
  if (!catalogs || !empresas) return <Unavailable />;
  const input = 'mt-1 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-3 text-base';
  const page = Math.min(positiveInteger(one(params.pagina)) ?? 1, 10000);
  function pageLink(n: number) { const q = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (one(v)) q.set(k, one(v)); q.set('pagina', String(n)); return `/eventos-festas/empresas?${q}`; }
  return <>
    <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
    {description && <p className="mt-3 max-w-2xl text-stone-600">{description}</p>}
    <form action="/eventos-festas/empresas" className="my-8 grid gap-4 rounded-2xl border border-rose-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Pesquisar profissionais">
      <label className="text-sm font-medium sm:col-span-2">O que procura?<input name="q" defaultValue={one(params.q)} placeholder="Fotógrafo, DJ, quinta…" maxLength={200} className={input} /></label>
      <label className="text-sm font-medium">Tipo de evento<select name="tipo" defaultValue={one(params.tipo)} className={input}><option value="">Todos os eventos</option>{catalogs.tipos.map(t => <option key={t.slug} value={t.slug}>{t.nome}</option>)}</select></label>
      <label className="text-sm font-medium">Categoria<select name="categoria" defaultValue={one(params.categoria)} className={input}><option value="">Todas as categorias</option>{catalogs.categorias.map(c => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
      <label className="text-sm font-medium">Serviço<select name="servico" defaultValue={one(params.servico)} className={input}><option value="">Todos os serviços</option>{catalogs.servicos.map(s => <option key={s.slug} value={s.slug}>{s.nome}</option>)}</select></label>
      <label className="text-sm font-medium">Localização<input name="local" defaultValue={one(params.local)} placeholder="Localidade, freguesia ou região" maxLength={200} className={input} /></label>
      <label className="text-sm font-medium">País (código)<input name="pais" defaultValue={one(params.pais)} placeholder="PT, FR, LU…" pattern="[A-Za-z]{2}" maxLength={2} className={input} /></label>
      <label className="text-sm font-medium">Pessoas (capacidade mínima)<input type="number" name="capacidade" min={1} max={1000000} defaultValue={one(params.capacidade)} className={input} /></label>
      <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4"><button className="rounded-xl bg-rose-800 px-6 py-3 font-semibold text-white hover:bg-rose-900">Pesquisar</button><Link href="/eventos-festas/empresas" className="text-sm underline">Limpar filtros</Link></div>
    </form>
    <p role="status" className="mb-4 text-sm text-stone-600">{empresas.length ? `${empresas.length} profissionais nesta página` : 'Ainda não encontramos profissionais com estes filtros. Experimente outra localização ou serviço.'}</p>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{empresas.map(e => <EmpresaCard key={e.slug} empresa={e} />)}</div>
    <nav aria-label="Páginas de resultados" className="mt-8 flex gap-6">{page > 1 && <Link href={pageLink(page - 1)} className="underline">← Anterior</Link>}{empresas.length === 24 && page < 10000 && <Link href={pageLink(page + 1)} className="underline">Seguinte →</Link>}</nav>
  </>;
}
