import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  calcularMatch,
  type MatchCandidateInput,
  type MatchCandidateSkillInput,
  type MatchJobSkillInput,
  type MatchResult,
  type MunicipioCoord,
} from "@/lib/empregos/matching";

interface SearchParamsShape {
  q?: string;
  municipio?: string;
  modalidade?: string;
  ordenar?: string;
}

const MODALIDADE_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

// PostgREST às vezes devolve uma relação embutida (FK) como objeto único,
// às vezes como array de um elemento -- mesmo problema já documentado em
// app/admin/entidades/page.tsx (unwrap). Normalizamos aqui para sempre
// objeto ou null.
function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

function salarioLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `€${min} – €${max} /mês`;
  if (min != null) return `A partir de €${min} /mês`;
  return `Até €${max} /mês`;
}

export default async function EmpregosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      `id, titulo, categoria, modalidade, salario_min, salario_max, salario_fonte,
       created_at, data_publicacao, municipio_id, nivel_experiencia, nivel_formacao_minimo,
       empregos_empresas ( nome_empresa ),
       municipios ( nome, distrito_regiao )`
    )
    .eq("estado", "publicada")
    .order("data_publicacao", { ascending: false });

  if (params.q && params.q.trim()) {
    const termo = params.q.trim().replace(/[%,]/g, "");
    query = query.or(`titulo.ilike.%${termo}%,categoria.ilike.%${termo}%`);
  }
  if (params.municipio) {
    query = query.eq("municipio_id", Number(params.municipio));
  }
  if (params.modalidade) {
    query = query.eq("modalidade", params.modalidade);
  }

  type JobRow = {
    id: number;
    titulo: string;
    categoria: string | null;
    modalidade: string;
    salario_min: number | null;
    salario_max: number | null;
    salario_fonte: string;
    created_at: string;
    data_publicacao: string | null;
    municipio_id: number | null;
    nivel_experiencia: string | null;
    nivel_formacao_minimo: string | null;
    empregos_empresas: { nome_empresa: string } | { nome_empresa: string }[] | null;
    municipios:
      | { nome: string; distrito_regiao: string }
      | { nome: string; distrito_regiao: string }[]
      | null;
  };

  const { data: jobsData } = await query;

  const jobs = ((jobsData ?? []) as JobRow[]).map((j) => ({
    ...j,
    empresa: unwrap<{ nome_empresa: string }>(j.empregos_empresas),
    municipio: unwrap<{ nome: string; distrito_regiao: string }>(j.municipios),
  }));

  type MunicipioOpt = { id: number; nome: string; distrito_regiao: string; latitude: number | null; longitude: number | null };

  const { data: municipiosData } = await supabase
    .from("municipios")
    .select("id, nome, distrito_regiao, latitude, longitude")
    .order("nome");

  const municipios = (municipiosData ?? []) as MunicipioOpt[];
  const municipiosPorId = new Map<number, MunicipioCoord>(
    municipios.map((m) => [m.id, { latitude: m.latitude, longitude: m.longitude }])
  );

  // Compatibilidade por vaga (Fase 7) -- só calculada quando há sessão
  // iniciada e o candidato já preencheu o perfil; caso contrário os
  // cartões ficam sem badge, sem penalizar nem inventar um score.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let candidateProfile: MatchCandidateInput | null = null;
  let candidateSkills: MatchCandidateSkillInput[] = [];

  if (user) {
    const { data: perfilRow } = await supabase
      .from("candidate_profiles")
      .select("nivel_experiencia, nivel_formacao, municipio_id, disponivel_mudanca_residencia")
      .eq("id", user.id)
      .maybeSingle();

    if (perfilRow) {
      candidateProfile = perfilRow as MatchCandidateInput;
      const { data: candidateSkillRows } = await supabase
        .from("candidate_skills")
        .select("skill_id")
        .eq("candidate_id", user.id);
      candidateSkills = (candidateSkillRows ?? []) as MatchCandidateSkillInput[];
    }
  }

  const jobSkillsPorJob = new Map<number, MatchJobSkillInput[]>();
  if (candidateProfile && jobs.length > 0) {
    const { data: jobSkillsRows } = await supabase
      .from("job_skills")
      .select("job_id, skill_id, obrigatoria")
      .in(
        "job_id",
        jobs.map((j) => j.id)
      );
    for (const s of (jobSkillsRows ?? []) as { job_id: number; skill_id: number; obrigatoria: boolean }[]) {
      const lista = jobSkillsPorJob.get(s.job_id) ?? [];
      lista.push({ skill_id: s.skill_id, obrigatoria: s.obrigatoria });
      jobSkillsPorJob.set(s.job_id, lista);
    }
  }

  let jobsComMatch = jobs.map((job) => ({
    ...job,
    match: candidateProfile
      ? calcularMatch(
          {
            nivel_experiencia: job.nivel_experiencia,
            nivel_formacao_minimo: job.nivel_formacao_minimo,
            municipio_id: job.municipio_id,
            modalidade: job.modalidade,
          },
          jobSkillsPorJob.get(job.id) ?? [],
          candidateProfile,
          candidateSkills,
          municipiosPorId
        )
      : (null as MatchResult | null),
  }));

  if (params.ordenar === "compatibilidade" && candidateProfile) {
    jobsComMatch = [...jobsComMatch].sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));
  }

  function modalidadeHref(valor: string) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.municipio) sp.set("municipio", params.municipio);
    if (params.modalidade !== valor) sp.set("modalidade", valor);
    if (params.ordenar) sp.set("ordenar", params.ordenar);
    const qs = sp.toString();
    return qs ? `/empregos?${qs}` : "/empregos";
  }

  function ordenarHref(ativar: boolean) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.municipio) sp.set("municipio", params.municipio);
    if (params.modalidade) sp.set("modalidade", params.modalidade);
    if (ativar) sp.set("ordenar", "compatibilidade");
    const qs = sp.toString();
    return qs ? `/empregos?${qs}` : "/empregos";
  }

  // Leva os filtros atuais para o formulário de criação de alerta (Fase 9),
  // que os usa para sugerir o nome e pré-preencher os campos -- assim
  // "guardar esta pesquisa" guarda mesmo a pesquisa que o candidato via.
  function novoAlertaHref() {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.municipio) sp.set("municipio", params.municipio);
    if (params.modalidade) sp.set("modalidade", params.modalidade);
    const qs = sp.toString();
    return qs ? `/empregos/alertas/novo?${qs}` : "/empregos/alertas/novo";
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-sm text-terra-600 hover:text-terra-800">
              ← O Tio do Joca
            </Link>
            <h1 className="text-xl font-bold text-terra-800">Empregos</h1>
          </div>
          <div className="flex gap-2">
            {user && (
              <Link
                href="/empregos/alertas"
                className="rounded-lg border border-terra-200 bg-white px-3 py-1.5 text-sm font-medium text-terra-700 hover:border-terra-400"
              >
                Os meus alertas
              </Link>
            )}
            <Link
              href="/perfil/candidato"
              className="rounded-lg border border-terra-200 bg-white px-3 py-1.5 text-sm font-medium text-terra-700 hover:border-terra-400"
            >
              O meu perfil de candidato
            </Link>
            <Link
              href="/empregos/empresa"
              className="rounded-lg border border-terra-200 bg-white px-3 py-1.5 text-sm font-medium text-terra-700 hover:border-terra-400"
            >
              Sou empresa
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <form method="GET" className="mb-4 flex flex-wrap gap-3 rounded-xl border border-terra-200 bg-white p-4">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Título ou área (ex: eletricista, hotelaria...)"
            className="min-w-[220px] flex-1 rounded-lg border p-2 text-sm"
          />
          <select
            name="municipio"
            defaultValue={params.municipio ?? ""}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}, {m.distrito_regiao}
              </option>
            ))}
          </select>
          {params.modalidade && <input type="hidden" name="modalidade" value={params.modalidade} />}
          <button
            type="submit"
            className="rounded-lg bg-terra-600 px-4 py-2 text-sm font-medium text-white hover:bg-terra-700"
          >
            Procurar
          </button>
        </form>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODALIDADE_LABEL).map(([valor, label]) => (
              <Link
                key={valor}
                href={modalidadeHref(valor)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  params.modalidade === valor
                    ? "border-terra-600 bg-terra-600 text-white"
                    : "border-terra-200 bg-white text-terra-700 hover:border-terra-400"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          {user && (
            <Link href={novoAlertaHref()} className="text-sm text-terra-600 underline hover:text-terra-800">
              🔔 Guardar esta pesquisa como alerta
            </Link>
          )}
        </div>

        {candidateProfile && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-terra-600">Ordenar:</span>
            <Link
              href={ordenarHref(false)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                params.ordenar !== "compatibilidade"
                  ? "border-terra-600 bg-terra-600 text-white"
                  : "border-terra-200 bg-white text-terra-700 hover:border-terra-400"
              }`}
            >
              Mais recentes
            </Link>
            <Link
              href={ordenarHref(true)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                params.ordenar === "compatibilidade"
                  ? "border-terra-600 bg-terra-600 text-white"
                  : "border-terra-200 bg-white text-terra-700 hover:border-terra-400"
              }`}
            >
              Compatibilidade comigo
            </Link>
          </div>
        )}

        {jobsComMatch.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-8 text-center text-sm text-terra-600">
            Nenhuma vaga encontrada com estes filtros.
          </p>
        )}

        <div className="space-y-3">
          {jobsComMatch.map((job) => {
            const salario = salarioLabel(job.salario_min, job.salario_max);
            return (
              <Link
                key={job.id}
                href={`/empregos/${job.id}`}
                className="block rounded-xl border border-terra-200 bg-white p-5 hover:border-terra-400 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-terra-900">{job.titulo}</h2>
                    <p className="text-sm text-terra-600">
                      {job.empresa?.nome_empresa ?? "Empresa"}
                      {job.municipio && ` · ${job.municipio.nome}, ${job.municipio.distrito_regiao}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.match?.score != null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          job.match.score >= 70
                            ? "bg-green-100 text-green-700"
                            : job.match.score >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-terra-100 text-terra-600"
                        }`}
                      >
                        {job.match.score}% compatível
                      </span>
                    )}
                    <span className="rounded-full bg-terra-100 px-2 py-0.5 text-xs font-medium text-terra-700">
                      {MODALIDADE_LABEL[job.modalidade] ?? job.modalidade}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-terra-500">
                  {job.categoria && <span>🏷️ {job.categoria}</span>}
                  {salario && <span>💶 {salario}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
