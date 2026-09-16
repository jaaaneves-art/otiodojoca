import Link from "next/link";
import { BadgeCheck, Building2, MapPin, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Diretório público StandGo — empresas automóvel com presença ativa no
// módulo de viaturas. Segue o mesmo padrão de pesquisa do
// components/eventos-festas/directory.tsx: formulário GET com searchParams,
// resultados ordenados alfabeticamente, mobile-first.
//
// NOTA (PostgREST): embeds a saltos múltiplos (entidades <- entidade_empresas
// <- standgo_empresas) não são resolvidos pelo PostgREST (PGRST200), por isso
// a pesquisa decompõe-se em queries simples de um salto:
// presenças ativas -> ids -> entidades (com entidade_empresas!inner) ->
// atividades agrupadas por entidade.
//
// Campos públicos apenas (ver docs/standgo/20260915-ecossistema-profissional.md,
// secção "Página pública"): nunca selecionar responsáveis, IDs de perfis,
// identificação fiscal ou nome legal. A leitura pública exige
// entidades.estado = 'publicado' AND standgo_empresas.estado = 'ativo'.

export type StandGoSearchParams = Record<string, string | string[] | undefined>;

interface AtividadeCatalogo {
  codigo: string;
  nome: string;
}

interface StandPublico {
  id: number;
  slug: string;
  nome: string;
  descricao: string | null;
  freguesia_id: number | null;
  fotografias: string[] | null;
  freguesias: { nome: string } | { nome: string }[] | null;
  entidade_empresas:
    | { verificada: boolean; pais_codigo: string }
    | { verificada: boolean; pais_codigo: string }[]
    | null;
}

function um<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? valor[0] ?? null : valor ?? null;
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function Indisponivel() {
  return (
    <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Diretório temporariamente indisponível</h2>
      <p className="mt-2 text-slate-600">Tenta novamente mais tarde.</p>
      <Link href="/viaturas" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
        Voltar ao StandGo
      </Link>
    </div>
  );
}

function StandCard({ stand, atividades }: { stand: StandPublico; atividades: string[] }) {
  const empresa = um(stand.entidade_empresas);
  const freguesia = um(stand.freguesias);
  const foto = stand.fotografias?.[0];

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="mb-4 h-32 w-full rounded-xl object-cover" />
      )}
      <h2 className="break-words text-xl font-bold text-slate-950">
        <Link className="hover:underline" href={`/entidades/${stand.slug}`}>
          {stand.nome}
        </Link>
      </h2>
      <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
        <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        {[freguesia?.nome, empresa?.pais_codigo].filter(Boolean).join(" · ")}
      </p>
      {atividades.length > 0 && (
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-700">
          {atividades[0]}
          {atividades.length > 1 ? ` +${atividades.length - 1}` : ""}
        </p>
      )}
      <p className="my-4 line-clamp-3 text-sm text-slate-700">
        {stand.descricao || "Conhece os serviços desta empresa automóvel."}
      </p>
      <p className="mt-auto flex items-center gap-1 text-xs text-slate-500">
        {empresa?.verificada ? (
          <>
            <BadgeCheck size={16} className="text-emerald-700" aria-hidden="true" />
            Empresa verificada
          </>
        ) : (
          "Empresa ainda não verificada"
        )}
      </p>
      <Link
        href={`/entidades/${stand.slug}`}
        className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
      >
        Ver empresa →
      </Link>
    </article>
  );
}

export async function StandGoDirectory({
  params,
  title = "Diretório de stands e empresas automóvel",
  description,
}: {
  params: StandGoSearchParams;
  title?: string;
  description?: string;
}) {
  const supabase = await createClient();

  const termoRaw = one(params.q).trim().slice(0, 200);
  const atividadeRaw = one(params.atividade).trim().slice(0, 150);
  const freguesiaRaw = one(params.freguesia).trim();
  let paisRaw = one(params.pais).trim().toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(paisRaw)) paisRaw = "PT";

  const [{ data: atividadesCatalogo, error: erroCatalogo }, { data: freguesiasOpcoes, error: erroFreguesias }] =
    await Promise.all([
      supabase.from("standgo_atividades").select("codigo, nome").eq("ativo", true).order("nome"),
      supabase.from("freguesias").select("id, nome").eq("active", true).order("nome"),
    ]);

  if (erroCatalogo || erroFreguesias) return <Indisponivel />;

  // Presenças StandGo ativas (RLS já garante entidade publicada, ver
  // docs/standgo/20260915-ecossistema-profissional.md — a dupla condição em
  // entidades.estado abaixo é defesa em profundidade).
  const { data: presencas } = await supabase
    .from("standgo_empresas")
    .select("entidade_id")
    .eq("estado", "ativo");

  let candidatas: number[] = (presencas ?? []).map(
    (p: { entidade_id: number }) => p.entidade_id
  );

  // Filtro por atividade (semântica EXISTS de
  // docs/standgo/20260915-ecossistema-profissional.md): o código do catálogo
  // resolve-se primeiro ao id da atividade e depois aos entidade_id associados.
  let atividadeInexistente = false;
  if (atividadeRaw) {
    const { data: atividade } = await supabase
      .from("standgo_atividades")
      .select("id")
      .eq("codigo", atividadeRaw)
      .eq("ativo", true)
      .maybeSingle();
    if (!atividade) {
      atividadeInexistente = true;
    } else {
      const { data: associacoes } = await supabase
        .from("standgo_empresa_atividades")
        .select("entidade_id")
        .eq("atividade_id", atividade.id);
      const idsAtividade = (associacoes ?? []).map(
        (a: { entidade_id: number }) => a.entidade_id
      );
      candidatas = candidatas.filter((id) => idsAtividade.includes(id));
    }
  }

  let stands: StandPublico[] = [];
  const atividadesPorEntidade: Record<number, string[]> = {};
  let erroPesquisa = false;

  if (!atividadeInexistente && candidatas.length > 0) {
    // Seleção explícita de campos públicos — ver nota no topo do ficheiro.
    // entidade_empresas!inner: exige a extensão empresarial (toda a empresa
    // StandGo a tem por FK) e permite filtrar por pais_codigo.
    let query = supabase
      .from("entidades")
      .select(
        `
        id, slug, nome, descricao, freguesia_id, fotografias,
        freguesias(nome),
        entidade_empresas!inner(verificada, pais_codigo)
      `
      )
      .eq("estado", "publicado")
      .in("id", candidatas)
      .eq("entidade_empresas.pais_codigo", paisRaw)
      .order("nome");

    // O operador .or() parte os termos em vírgulas — sanitizar para não
    // quebrar a sintaxe nem alargar o padrão sem querer.
    const termo = termoRaw.replace(/[%,]/g, " ").trim();
    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%`);
    }

    if (/^\d+$/.test(freguesiaRaw)) {
      query = query.eq("freguesia_id", Number(freguesiaRaw));
    }

    const { data, error } = await query;
    erroPesquisa = Boolean(error);
    stands = (data ?? []) as StandPublico[];

    const idsResultado = stands.map((s) => s.id);
    if (idsResultado.length > 0) {
      const { data: assocs } = await supabase
        .from("standgo_empresa_atividades")
        .select("entidade_id, standgo_atividades(nome)")
        .in("entidade_id", idsResultado);
      for (const assoc of assocs ?? []) {
        const nome = um(
          (assoc as { standgo_atividades?: { nome: string } | { nome: string }[] | null })
            .standgo_atividades
        )?.nome;
        if (!nome) continue;
        const entidadeId = (assoc as { entidade_id: number }).entidade_id;
        (atividadesPorEntidade[entidadeId] ??= []).push(nome);
      }
    }
  }

  if (erroPesquisa) return <Indisponivel />;

  const inputClasse =
    "mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <>
      <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-slate-600">{description}</p>}

      <form
        action="/viaturas/stands/diretorio"
        className="my-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Pesquisar empresas automóvel"
      >
        <label className="text-sm font-medium sm:col-span-2">
          O que procuras?
          <input name="q" defaultValue={one(params.q)} placeholder="Nome da empresa ou serviço…" maxLength={200} className={inputClasse} />
        </label>
        <label className="text-sm font-medium">
          Atividade
          <select name="atividade" defaultValue={atividadeRaw} className={inputClasse}>
            <option value="">Todas as atividades</option>
            {(atividadesCatalogo ?? []).map((a: AtividadeCatalogo) => (
              <option key={a.codigo} value={a.codigo}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Freguesia
          <select name="freguesia" defaultValue={freguesiaRaw} className={inputClasse}>
            <option value="">Todas as freguesias</option>
            {(freguesiasOpcoes ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          País (código)
          <input name="pais" defaultValue={paisRaw} placeholder="PT, FR, LU…" pattern="[A-Za-z]{2}" maxLength={2} className={inputClasse} />
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
          <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-500">
            Pesquisar
          </button>
          <Link href="/viaturas/stands/diretorio" className="text-sm text-slate-600 underline hover:text-slate-900">
            Limpar filtros
          </Link>
        </div>
      </form>

      <p role="status" className="mb-4 text-sm text-slate-600">
        {stands.length
          ? `${stands.length} ${stands.length === 1 ? "empresa encontrada" : "empresas encontradas"}`
          : "Ainda não encontrámos empresas com estes filtros. Experimenta outra atividade ou localização."}
      </p>

      {stands.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stands.map((s) => (
            <StandCard key={s.id} stand={s} atividades={atividadesPorEntidade[s.id] ?? []} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <SearchX size={26} aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-black text-slate-950">Sem resultados nesta combinação</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Ajusta a atividade, a freguesia ou o país para encontrares mais empresas automóvel.
          </p>
        </div>
      )}

      <p className="mt-10 flex items-center gap-2 text-xs text-slate-500">
        <Building2 size={14} aria-hidden="true" />
        Ficha pública de cada empresa: contactos, localização, horários e atividades.
      </p>
    </>
  );
}
