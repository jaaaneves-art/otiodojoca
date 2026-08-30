import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calcularMatch,
  type MatchCandidateInput,
  type MatchCandidateSkillInput,
  type MatchJobSkillInput,
  type MunicipioCoord,
} from "@/lib/empregos/matching";

const MODALIDADE_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

const TIPO_CONTRATO_LABEL: Record<string, string> = {
  efetivo: "Contrato efetivo",
  termo_certo: "Termo certo",
  termo_incerto: "Termo incerto",
  prestacao_servicos: "Prestação de serviços",
  estagio: "Estágio",
  part_time: "Part-time",
  freelance: "Freelance",
};

const NIVEL_EXPERIENCIA_LABEL: Record<string, string> = {
  sem_experiencia: "Sem experiência",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sénior",
  especialista: "Especialista",
};

const NIVEL_FORMACAO_LABEL: Record<string, string> = {
  sem_requisito: "Sem requisito",
  ensino_basico: "Ensino básico",
  ensino_secundario: "Ensino secundário",
  licenciatura: "Licenciatura",
  mestrado: "Mestrado",
  doutoramento: "Doutoramento",
};

const APPLICATION_ESTADO_LABEL: Record<string, string> = {
  submetida: "Submetida",
  em_analise: "Em análise",
  entrevista: "Entrevista",
  selecionada: "Selecionada",
  rejeitada: "Rejeitada",
  retirada: "Retirada",
};

const MOTIVO_DENUNCIA_LABEL: Record<string, string> = {
  spam: "Spam ou publicidade",
  fraude: "Suspeita de fraude/burla",
  discriminatorio: "Conteúdo discriminatório",
  conteudo_inadequado: "Conteúdo inadequado",
  outro: "Outro motivo",
};

const DENUNCIA_ESTADO_LABEL: Record<string, string> = {
  pendente: "em análise pela nossa equipa",
  resolvida: "resolvida",
  ignorada: "revista, sem necessidade de ação",
};

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

export default async function VagaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: jobData, error } = await supabase
    .from("jobs")
    .select(
      `id, titulo, descricao, categoria, modalidade, tipo_contrato,
       nivel_experiencia, nivel_formacao_minimo, salario_min, salario_max,
       salario_fonte, estado, data_publicacao, municipio_id,
       empregos_empresas ( nome_empresa, descricao, website ),
       municipios ( nome, distrito_regiao, latitude, longitude )`
    )
    .eq("id", id)
    .eq("estado", "publicada")
    .maybeSingle();

  if (error || !jobData) {
    notFound();
  }

  type EmpresaRel = { nome_empresa: string; descricao: string | null; website: string | null };
  type MunicipioRel = { nome: string; distrito_regiao: string; latitude: number | null; longitude: number | null };

  const empresa = unwrap<EmpresaRel>(jobData.empregos_empresas);
  const municipio = unwrap<MunicipioRel>(jobData.municipios);

  const { data: jobSkillsRows } = await supabase
    .from("job_skills")
    .select("skill_id, obrigatoria, skills(nome)")
    .eq("job_id", id);

  // skills(nome) é uma relação embutida -- tal como empregos_empresas/municipios
  // acima, o Supabase às vezes tipa-a como objeto único, às vezes como array de
  // um elemento; normalizamos com o mesmo unwrap() em vez de assumir uma forma.
  type JobSkillRow = {
    skill_id: number;
    obrigatoria: boolean;
    skills: { nome: string } | { nome: string }[] | null;
  };
  const jobSkills = ((jobSkillsRows ?? []) as JobSkillRow[])
    .map((s) => ({
      skill_id: s.skill_id,
      obrigatoria: s.obrigatoria,
      skills: unwrap<{ nome: string }>(s.skills),
    }))
    .filter((s) => s.skills?.nome);
  const jobSkillsForMatch: MatchJobSkillInput[] = jobSkills.map((s) => ({
    skill_id: s.skill_id,
    obrigatoria: s.obrigatoria,
    nome: s.skills?.nome,
  }));

  const salario = salarioLabel(jobData.salario_min, jobData.salario_max);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let minhaCandidatura: { id: number; estado: string; created_at: string } | null = null;
  if (user) {
    const { data: candidaturaExistente } = await supabase
      .from("applications")
      .select("id, estado, created_at")
      .eq("job_id", id)
      .eq("candidate_id", user.id)
      .maybeSingle();
    minhaCandidatura = candidaturaExistente;
  }

  // Compatibilidade com o meu perfil (Fase 7 -- motor de regras de
  // lib/empregos/matching.ts). Só calculado quando o utilizador está
  // autenticado e já preencheu o perfil de candidato -- caso contrário
  // mostramos uma chamada de atenção a completá-lo, em vez de um score
  // enganador calculado com dados em falta.
  let candidateProfile: MatchCandidateInput | null = null;
  let candidateSkills: MatchCandidateSkillInput[] = [];
  const municipiosPorId = new Map<number, MunicipioCoord>();

  if (jobData.municipio_id && municipio) {
    municipiosPorId.set(jobData.municipio_id, {
      latitude: municipio.latitude,
      longitude: municipio.longitude,
    });
  }

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

      if (
        candidateProfile.municipio_id &&
        candidateProfile.municipio_id !== jobData.municipio_id
      ) {
        const { data: candMunicipio } = await supabase
          .from("municipios")
          .select("latitude, longitude")
          .eq("id", candidateProfile.municipio_id)
          .maybeSingle();
        if (candMunicipio) {
          municipiosPorId.set(candidateProfile.municipio_id, candMunicipio as MunicipioCoord);
        }
      }
    }
  }

  const match = candidateProfile
    ? calcularMatch(
        {
          nivel_experiencia: jobData.nivel_experiencia,
          nivel_formacao_minimo: jobData.nivel_formacao_minimo,
          municipio_id: jobData.municipio_id,
          modalidade: jobData.modalidade,
        },
        jobSkillsForMatch,
        candidateProfile,
        candidateSkills,
        municipiosPorId
      )
    : null;

  const COMPONENTES_MATCH = match
    ? [
        { label: "Competências", resultado: match.competencias },
        { label: "Localização", resultado: match.localizacao },
        { label: "Experiência", resultado: match.experiencia },
        { label: "Formação", resultado: match.formacao },
      ]
    : [];

  // Denúncia da vaga (Fase 8 -- moderação). Guardamos a mais recente do
  // próprio utilizador para não mostrar o formulário outra vez depois
  // de já ter denunciado -- serve também de travão simples contra
  // denúncias repetidas em cadeia, sem precisar de um constraint na BD.
  let minhaDenuncia: { id: number; estado: string } | null = null;
  if (user) {
    const { data: denunciaExistente } = await supabase
      .from("job_reports")
      .select("id, estado")
      .eq("job_id", id)
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    minhaDenuncia = denunciaExistente;
  }

  async function denunciarVaga(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Não autenticado");
    }

    const jobIdForm = Number(formData.get("job_id"));
    const motivo = formData.get("motivo") as string;
    const mensagem = ((formData.get("mensagem") as string) || "").trim() || null;

    if (!Object.keys(MOTIVO_DENUNCIA_LABEL).includes(motivo)) {
      throw new Error("Escolhe um motivo válido para a denúncia.");
    }

    const { error: reportError } = await supabase.from("job_reports").insert({
      job_id: jobIdForm,
      reporter_id: user.id,
      motivo,
      mensagem,
    });

    if (reportError) {
      throw new Error("Não foi possível enviar a denúncia. " + reportError.message);
    }

    revalidatePath(`/empregos/${jobIdForm}`);
  }

  async function candidatarVaga(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Não autenticado");
    }

    const jobIdForm = Number(formData.get("job_id"));
    const mensagem = ((formData.get("mensagem") as string) || "").trim() || null;

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .insert({ job_id: jobIdForm, candidate_id: user.id, mensagem })
      .select("id")
      .single();

    if (applicationError || !application) {
      throw new Error(
        "Não foi possível enviar a candidatura — talvez já te tenhas candidatado a esta vaga. " +
          (applicationError?.message ?? "")
      );
    }

    await supabase.from("application_events").insert({
      application_id: application.id,
      estado: "submetida",
      autor_id: user.id,
    });

    // Notificar a empresa -- notifications só aceita insert via service
    // role ("Sistema cria notificacoes", to service_role), por isso este
    // passo usa createAdminClient() em vez do cliente normal, mesmo
    // motivo documentado em app/admin/entidades/actions.ts.
    const { data: jobRow } = await supabase
      .from("jobs")
      .select("titulo, empregos_empresas(profile_id)")
      .eq("id", jobIdForm)
      .single();

    type EmpresaProfileRel = { profile_id: string } | { profile_id: string }[] | null;
    const empresaRel = (jobRow?.empregos_empresas ?? null) as EmpresaProfileRel;
    const empresaProfileId = Array.isArray(empresaRel)
      ? empresaRel[0]?.profile_id
      : empresaRel?.profile_id;

    if (empresaProfileId) {
      const admin = createAdminClient();
      await admin.from("notifications").insert({
        user_id: empresaProfileId,
        type: "job_application",
        message: `Nova candidatura para "${jobRow?.titulo ?? "a tua vaga"}"`,
        link: `/empregos/empresa/vagas/${jobIdForm}/candidaturas`,
      });
    }

    revalidatePath(`/empregos/${jobIdForm}`);
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/empregos" className="text-sm text-terra-600 hover:text-terra-800">
            ← Empregos
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <div className="rounded-xl border border-terra-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-terra-900">{jobData.titulo}</h1>
              <p className="text-terra-600">
                {empresa?.nome_empresa ?? "Empresa"}
                {municipio && ` · ${municipio.nome}, ${municipio.distrito_regiao}`}
              </p>
            </div>
            <span className="rounded-full bg-terra-100 px-3 py-1 text-sm font-medium text-terra-700">
              {MODALIDADE_LABEL[jobData.modalidade] ?? jobData.modalidade}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-terra-600">
            {jobData.categoria && (
              <span className="rounded-full bg-terra-50 border border-terra-200 px-2 py-1">
                🏷️ {jobData.categoria}
              </span>
            )}
            {jobData.tipo_contrato && (
              <span className="rounded-full bg-terra-50 border border-terra-200 px-2 py-1">
                📄 {TIPO_CONTRATO_LABEL[jobData.tipo_contrato] ?? jobData.tipo_contrato}
              </span>
            )}
            {jobData.nivel_experiencia && (
              <span className="rounded-full bg-terra-50 border border-terra-200 px-2 py-1">
                📈 {NIVEL_EXPERIENCIA_LABEL[jobData.nivel_experiencia] ?? jobData.nivel_experiencia}
              </span>
            )}
            {jobData.nivel_formacao_minimo && jobData.nivel_formacao_minimo !== "sem_requisito" && (
              <span className="rounded-full bg-terra-50 border border-terra-200 px-2 py-1">
                🎓 {NIVEL_FORMACAO_LABEL[jobData.nivel_formacao_minimo] ?? jobData.nivel_formacao_minimo}
              </span>
            )}
            {salario && (
              <span className="rounded-full bg-terra-50 border border-terra-200 px-2 py-1">
                💶 {salario}{" "}
                <span className="text-terra-400">
                  ({jobData.salario_fonte === "empresa" ? "indicado pela empresa" : "estimativa"})
                </span>
              </span>
            )}
          </div>

          <div className="mt-6 whitespace-pre-wrap text-terra-800">{jobData.descricao}</div>

          {jobSkills.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-terra-800">Competências pedidas</h2>
              <div className="flex flex-wrap gap-2">
                {jobSkills.map((s, i) => (
                  <span
                    key={i}
                    className={`rounded-full border px-2 py-1 text-xs ${
                      s.obrigatoria
                        ? "border-terra-400 bg-terra-100 text-terra-800"
                        : "border-terra-200 bg-white text-terra-600"
                    }`}
                  >
                    {s.skills?.nome}
                    {s.obrigatoria ? "" : " (desejável)"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {empresa?.descricao && (
            <div className="mt-6 rounded-lg bg-terra-50 p-4 text-sm text-terra-700">
              <strong>Sobre {empresa.nome_empresa}:</strong> {empresa.descricao}
            </div>
          )}

          {user && !candidateProfile && (
            <div className="mt-6 rounded-lg border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
              Completa o{" "}
              <Link href="/perfil/candidato" className="font-medium underline">
                teu perfil de candidato
              </Link>{" "}
              para veres a tua compatibilidade com esta vaga.
            </div>
          )}

          {match && (
            <div className="mt-6 rounded-lg border border-terra-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-terra-800">A tua compatibilidade</h2>
                {match.score != null && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      match.score >= 70
                        ? "bg-green-100 text-green-700"
                        : match.score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-terra-100 text-terra-600"
                    }`}
                  >
                    {match.score}%
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {COMPONENTES_MATCH.map((c) => (
                  <div key={c.label} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 font-medium text-terra-700">{c.label}</span>
                    {c.resultado.aplicavel && c.resultado.score != null ? (
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-terra-100">
                        <div
                          className={`h-full rounded-full ${
                            c.resultado.score >= 70
                              ? "bg-green-500"
                              : c.resultado.score >= 40
                                ? "bg-amber-500"
                                : "bg-terra-400"
                          }`}
                          style={{ width: `${c.resultado.score}%` }}
                        />
                      </div>
                    ) : (
                      <span className="flex-1 italic text-terra-400">n/d</span>
                    )}
                    <span className="w-40 text-terra-500">{c.resultado.detalhe}</span>
                  </div>
                ))}
              </div>
              {match.competencias.competenciasEmFalta.length > 0 && (
                <p className="mt-3 text-xs text-terra-600">
                  Competências obrigatórias em falta no teu perfil:{" "}
                  <strong>{match.competencias.competenciasEmFalta.join(", ")}</strong>
                </p>
              )}
            </div>
          )}

          <div className="mt-8 border-t border-terra-100 pt-6">
            {!user && (
              <div className="rounded-lg border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
                <Link href="/login" className="font-medium underline">
                  Entra
                </Link>{" "}
                ou{" "}
                <Link href="/registo" className="font-medium underline">
                  cria conta
                </Link>{" "}
                para te candidatares a esta vaga.
              </div>
            )}

            {user && !minhaCandidatura && (
              <form action={candidatarVaga} className="space-y-3">
                <input type="hidden" name="job_id" value={jobData.id} />
                <label className="text-sm font-medium text-terra-800">Candidatar-me</label>
                <textarea
                  name="mensagem"
                  rows={4}
                  placeholder="Mensagem para a empresa (opcional)"
                  className="w-full rounded-lg border p-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-terra-600 px-6 py-2 font-medium text-white hover:bg-terra-700"
                >
                  Candidatar-me
                </button>
              </form>
            )}

            {user && minhaCandidatura && (
              <div className="rounded-lg border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
                Já te candidataste a esta vaga em{" "}
                {new Date(minhaCandidatura.created_at).toLocaleDateString("pt-PT")} — estado
                atual:{" "}
                <strong>
                  {APPLICATION_ESTADO_LABEL[minhaCandidatura.estado] ?? minhaCandidatura.estado}
                </strong>
                .{" "}
                <Link href="/empregos/candidaturas" className="underline">
                  Ver as minhas candidaturas
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="mt-4 text-xs text-terra-400">
              {!minhaDenuncia ? (
                <details>
                  <summary className="cursor-pointer hover:text-terra-600">Denunciar esta vaga</summary>
                  <form action={denunciarVaga} className="mt-2 space-y-2 rounded-lg border border-terra-200 bg-terra-50 p-3">
                    <input type="hidden" name="job_id" value={jobData.id} />
                    <select name="motivo" required className="w-full rounded-lg border p-2 text-sm text-terra-700">
                      <option value="">Escolhe um motivo...</option>
                      {Object.entries(MOTIVO_DENUNCIA_LABEL).map(([valor, label]) => (
                        <option key={valor} value={valor}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      name="mensagem"
                      rows={2}
                      placeholder="Detalhes (opcional)"
                      className="w-full rounded-lg border p-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-terra-300 bg-white px-3 py-1.5 text-xs font-medium text-terra-700 hover:border-terra-400"
                    >
                      Enviar denúncia
                    </button>
                  </form>
                </details>
              ) : (
                <p>
                  Denunciaste esta vaga — {DENUNCIA_ESTADO_LABEL[minhaDenuncia.estado] ?? minhaDenuncia.estado}.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
