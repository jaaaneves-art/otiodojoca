'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarEmpresa, pedirAcesso } from '@/app/eventos-festas/actions';
import type { Catalogs, EmpresaGerida } from '@/lib/eventos-festas/types';
const input = 'mt-1 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-3 text-base';
export function CompanyForm({ catalogs: c, empresa: e }: { catalogs: Catalogs; empresa?: EmpresaGerida }) {
  const router = useRouter();
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState(e?.pais_codigo ?? 'PT');
  const [services, setServices] = useState<string[]>(e?.servicos ?? []);
  const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  async function submit(form: FormData) {
    setError(''); setPending(true);
    // O estado mantém seleções de serviços mesmo com um filtro de texto ativo.
    form.delete('servicos'); services.forEach(s => form.append('servicos', s));
    try {
      const result = await guardarEmpresa(form);
      if (result.error) setError(result.error);
      else { router.push(`/eventos-festas/painel/${result.id}?guardado=1`); router.refresh(); }
    } catch { setError('Não foi possível guardar. Tente novamente.'); }
    finally { setPending(false); }
  }
  return <form action={submit} className="mt-6 space-y-8">
    {e && <input type="hidden" name="entidade_id" value={e.id} />}
    <fieldset disabled={pending} className="grid min-w-0 gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"><legend className="px-2 text-lg font-semibold">Perfil da empresa</legend>
      <p className="text-sm text-stone-600 sm:col-span-2">Nome, contactos e imagens são partilhados com a mesma entidade nos outros módulos OTJ. Introduza apenas contactos públicos.</p>
      <label className="sm:col-span-2">Nome<input name="nome" defaultValue={e?.nome} required minLength={2} maxLength={200} className={input} /></label>
      <label className="sm:col-span-2">Descrição<textarea name="descricao" defaultValue={e?.descricao ?? ''} rows={5} maxLength={10000} className={input} /></label>
      <label>País (código de duas letras)<input name="pais_codigo" value={country} onChange={event => setCountry(event.target.value.toUpperCase())} required pattern="[A-Za-z]{2}" maxLength={2} placeholder="PT, FR, LU…" className={input} /></label>
      <label>Localidade<input name="localidade" defaultValue={e?.localidade ?? ''} maxLength={200} className={input} /></label>
      <label>Região / distrito<input name="regiao" defaultValue={e?.regiao ?? ''} maxLength={200} className={input} /></label>
      <label>Localização / morada pública<input name="lugar" defaultValue={e?.lugar ?? ''} maxLength={500} className={input} /></label>
      <input type="hidden" name="freguesia_id" value={country === 'PT' ? e?.freguesia_id ?? '' : ''} />
      {e?.freguesia_id && country === 'PT' && <p className="text-sm text-stone-600 sm:col-span-2">A freguesia portuguesa associada à entidade é preservada. Ao mudar o país, indique a nova localidade.</p>}
      <label>Telefone público<input name="telefone" type="tel" defaultValue={e?.telefone ?? ''} maxLength={80} className={input} /></label>
      <label>Email público<input name="email" type="email" defaultValue={e?.email ?? ''} maxLength={254} className={input} /></label>
      <label className="sm:col-span-2">Website<input name="website" type="url" defaultValue={e?.website ?? ''} maxLength={2000} placeholder="https://" className={input} /></label>
      {['instagram', 'facebook', 'linkedin'].map(key => <label key={key} className="capitalize">{key}<input name={key} type="url" defaultValue={e?.redes_sociais?.[key] ?? ''} maxLength={2000} placeholder="https://" className={input} /></label>)}
      <label className="sm:col-span-2">Imagens e portefólio<textarea name="fotografias" rows={4} defaultValue={e?.fotografias?.join('\n') ?? ''} className={input} aria-describedby="imagens-ajuda" /><span id="imagens-ajuda" className="mt-1 block text-sm text-stone-600">Até 12 endereços HTTPS de imagens alojadas no OTJ, um por linha. A primeira imagem é a capa ou logótipo; as restantes mostram os seus trabalhos. Pode reutilizar imagens já publicadas.</span></label>
    </fieldset>
    <fieldset disabled={pending} className="grid min-w-0 gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"><legend className="px-2 text-lg font-semibold">Presença em Eventos & Festas</legend>
      <label>Capacidade do espaço (pessoas)<input type="number" name="capacidade" min={1} max={1000000} defaultValue={e?.capacidade ?? ''} className={input} /></label>
      <label>Área de serviço<input name="area_servico" defaultValue={e?.area_servico ?? ''} maxLength={1000} placeholder="Ex.: Luxemburgo e Grande Região" className={input} /></label>
    </fieldset>
    <fieldset disabled={pending} className="min-w-0 rounded-2xl border bg-white p-5"><legend className="px-2 text-lg font-semibold">Serviços</legend>
      <label>Filtrar serviços<input value={query} onChange={event => setQuery(event.target.value)} className={input} placeholder="Fotografia, catering, DJ…" /></label>
      <p className="my-3 text-sm" aria-live="polite">{services.length} selecionados · escolha até 80</p>
      <div className="grid gap-3 md:grid-cols-2">{c.categorias.map(cat => {
        const options = c.servicos.filter(s => c.relacoes.some(r => r.servico_slug === s.slug && r.categoria_slug === cat.slug) && normalize(s.nome).includes(normalize(query)));
        return options.length ? <details key={cat.slug} open={query ? true : undefined} className="rounded-lg border p-3"><summary className="cursor-pointer font-semibold">{cat.nome}</summary><div className="mt-3 space-y-2">{options.map(s => <label key={s.slug} className="flex items-start gap-3 py-1 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-rose-800" checked={services.includes(s.slug)} onChange={event => setServices(prev => event.target.checked ? [...new Set([...prev, s.slug])] : prev.filter(v => v !== s.slug))} /><span>{s.nome}{s.nota && <span className="block text-xs text-stone-500">{s.nota}</span>}</span></label>)}</div></details> : null;
      })}</div>
    </fieldset>
    <fieldset disabled={pending} className="min-w-0 rounded-2xl border bg-white p-5"><legend className="px-2 text-lg font-semibold">Tipos de evento</legend><p className="mb-4 text-sm text-stone-600">Escolha os tipos de evento para os quais presta serviços.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{c.tipos.filter(t => !t.grupo_slug).map(group => <div key={group.slug}><label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="tipos" value={group.slug} defaultChecked={e?.tipos.includes(group.slug)} className="accent-rose-800" />{group.nome}</label><div className="mt-2 space-y-2 pl-2">{c.tipos.filter(t => t.grupo_slug === group.slug).map(t => <label key={t.slug} className="flex items-start gap-2 text-sm"><input type="checkbox" name="tipos" value={t.slug} defaultChecked={e?.tipos.includes(t.slug)} className="mt-1 accent-rose-800" /><span>{t.nome}{t.slug === 'festa-de-divorcio-e-separacao' ? ' / despedida de casado' : ''}</span></label>)}</div></div>)}</div></fieldset>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    <p className="text-sm text-stone-600">Novas presenças são analisadas pela equipa OTJ antes de aparecerem no diretório. A publicação não atribui verificação profissional.</p>
    <div className="flex flex-wrap gap-3"><button disabled={pending} name="intencao" value="submeter" className="rounded-xl bg-rose-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'A guardar…' : e?.estado === 'ativo' ? 'Guardar alterações' : 'Submeter para publicação'}</button><button disabled={pending} name="intencao" value="rascunho" className="rounded-xl border border-stone-400 px-5 py-3 disabled:opacity-50">Guardar como rascunho</button></div>
  </form>;
}
export function ClaimForm({ slug }: { slug: string }) {
  const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  return <form action={async form => { setPending(true); try { const r = await pedirAcesso(form); setMessage(r.error ?? 'Pedido enviado. A equipa OTJ irá analisar a sua ligação à entidade.'); } catch { setMessage('Não foi possível enviar. Tente novamente.'); } finally { setPending(false); } }} className="mt-4 space-y-4">
    <input type="hidden" name="slug" value={slug} />
    <label className="block">Qual é a sua ligação à empresa?<textarea name="mensagem" required minLength={10} maxLength={2000} rows={3} className={input} /></label>
    <button disabled={pending} className="rounded-xl border border-rose-800 px-5 py-3 font-semibold text-rose-800 disabled:opacity-50">{pending ? 'A enviar…' : 'Pedir acesso à entidade'}</button><p role="status">{message}</p>
  </form>;
}
