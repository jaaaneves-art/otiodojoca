import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  calcularMatch,
  type MatchCandidateInput,
  type MatchCandidateSkillInput,
  type MatchJobSkillInput,
  type MatchResult,
  type MunicipioCoord,
} from "@/lib/empregos/matching";

const ESTADO_LABEL: Record<string, string> = {
  submetida: "Submetida",
  em_analise: "Em análise",
  entrevista: "Entrevista",
  selecionada: "Selecionada",
  rejeitada: "Rejeitada",
  retirada: "Retirada",
};

const ESTADO_COR: Record<string, string> = {
  submetida: "bg-terra-100 text-terra-700",
  em_analise: "bg-amber-100 text-amber-700",
  entrevista: "bg-amber-100 text-amber-700",
  selecionada: "bg-green-100 text-green-700",
  rejeitada: "bg-red-100 text-red-700",
  retirada: "bg-terra-200 text-terra-600",
};

const ESTADOS_ATRIBUIVEIS = ["em_analise", "entrevista", "selecionada", "rejeitada"];

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function CandidaturasVagaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      `id, titulo, modalidade, nivel_experiencia, nivel_formacao_minimo, municipio_id,
       empregos_empresas!inner ( profile_id, nome_empresa )`
    )
    .eq("id", id)
    .single();

  if (error || !job) {
    notFound();
  }

  type EmpresaRel = { profile_id: string; nome_empresa: string };
  const empresa = unwrap<EmpresaRel>(job.empregos_empresas) as EmpresaRel;

  if (empresa.profile_id !== user.id) {
    redirect("/empregos/empresa");
  }

  async function atualizarEstadoCandidatura(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("A tua sessão expirou. Entra novamente e tenta outra vez.");
    }

    const applicationId = Number(formData.get("application_id"));
    const novoEstado = formData.get("estado") as string;

    if (!ESTADOS_ATRIBUIVEIS.includes(novoEstado)) {
      throw new Error("Estado inválido.");
    }

    // RLS ("Empresa atualiza estado das candidaturas as suas vagas") já
    // garante que só o dono da vaga consegue isto -- o .select().single()
    // a seguir transforma um bloqueio silencioso num erro explícito, mesma
    // disciplina do resto do módulo (ver vagas/actions.ts).
    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ estado: novoEstado })
      .eq("id", applicationId)
      .neq("estado", "retirada")
      .select("id, job_id, candidate_id")
      .single();

    if (updateError || !updated) {
      throw new Error(
        "Não foi possível atualizar a candidatura — ou já não és o dono da vaga, ou ela foi retirada pelo candidato. " +
          (updateError?.message ?? "")
      );
    }

    await supabase.from("application_events").insert({
      application_id: applicationId,
      estado: novoEstado,
      autor_id: user.id,
    });

    // Notificar o candidato -- notifications só aceita insert via service
    // role ("Sistema cria notificacoes", to service_role).
    const { data: jobRow } = await supabase
      .from("jobs")
      .select("titulo")
      .eq("id", updated.job_id)
      .single();

    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: updated.candidate_id,
      type: "job_application",
      message: `A tua candidatura para "${jobRow?.titulo ?? "a vaga"}" passou a "${
        ESTADO_LABEL[novoEstado] ?? novoEstado
      }"`,
      link: "/empregos/candidaturas",
    });

    revalidatePath(`/empregos/empresa/vagas/${updated.job_id}/candidaturas`);
  }

  type CandidaturaRow = {
    id: number;
    estado: string;
    mensagem: string | null;
    created_at: string;
    candidate_id: string;
    profiles: { username: string; display_name: string | null } | { username: string; display_name: string | null }[] | null;
  };

  const { data: candidaturasData } = await supabase
    .from("applications")
    .select(
      `id, estado, mensagem, created_at, candidate_id,
       profiles!applications_candidate_id_fkey ( username, display_name )`
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const candidaturasBase = ((candidaturasData ?? []) as CandidaturaRow[]).map((c) => ({
    ...c,
    candidato: unwrap<{ username: string; display_name: string | null }>(c.profiles),
  }));

  // Compatibilidade de cada candidato com esta vaga (Fase 7). Os
  // perfis são carregados em lote (um único IN, não um pedido por
  // candidatura) e, tal como no resto do módulo, a RLS de
  // candidate_profiles/candidate_skills ("... publico visivel") filtra
  // silenciosamente os perfis que o candidato não tornou públicos --
  // esses ficam simplesmente sem badge de compatibilidade, por respeito
  // à privacidade escolhida pelo candidato.
  const candidateIds = [...new Set(candidaturasBase.map((c) => c.candidate_id))];

  const jobSkillsForMatch: MatchJobSkillInput[] = [];
  const perfisPorCandidato = new Map<string, MatchCandidateInput>();
  const skillsPorCandidato = new Map<string, MatchCandidateSkillInput[]>();
  const municipiosPorId = new Map<number, MunicipioCoord>();

  if (candidateIds.length > 0) {
    const { data: jobSkillsRows } = await supabase
      .from("job_skills")
      .select("skill_id, obrigatoria")
      .eq("job_id", id);
    jobSkillsForMatch.push(...((jobSkillsRows ?? []) as MatchJobSkillInput[]));

    const { data: perfisRows } = await supabase
      .from("candidate_profiles")
      .select("id, nivel_experiencia, nivel_formacao, municipio_id, disponivel_mudanca_residencia")
      .in("id", candidateIds);

    type PerfilRow = MatchCandidateInput & { id: string };
    for (const p of (perfisRows ?? []) as PerfilRow[]) {
      perfisPorCandidato.set(p.id, p);
    }

    const { data: skillsRows } = await supabase
      .from("candidate_skills")
      .select("candidate_id, skill_id")
      .in("candidate_id", candidateIds);
    for (const s of (skillsRows ?? []) as { candidate_id: string; skill_id: number }[]) {
      const lista = skillsPorCandidato.get(s.candidate_id) ?? [];
      lista.push({ skill_id: s.skill_id });
      skillsPorCandidato.set(s.candidate_id, lista);
    }

    const municipioIds = [
      ...new Set(
        [job.municipio_id, ...[...perfisPorCandidato.values()].map((p) => p.municipio_id)].filter(
          (v): v is number => v != null
        )
      ),
    ];
    if (municipioIds.length > 0) {
      const { data: municipiosRows } = await supabase
        .from("municipios")
        .select("id, latitude, longitude")
        .in("id", municipioIds);
      for (const m of (municipiosRows ?? []) as { id: number; latitude: number | null; longitude: number | null }[]) {
        municipiosPorId.set(m.id, { latitude: m.latitude, longitude: m.longitude });
      }
    }
  }

  const candidaturas = candidaturasBase.map((c) => {
    const perfil = perfisPorCandidato.get(c.candidate_id);
    const match: MatchResult | null = perfil
      ? calcularMatch(
          {
            nivel_experiencia: job.nivel_experiencia,
            nivel_formacao_minimo: job.nivel_formacao_minimo,
            municipio_id: job.municipio_id,
            modalidade: job.modalidade,
          },
          jobSkillsForMatch,
          perfil,
          skillsPorCandidato.get(c.candidate_id) ?? [],
          municipiosPorId
        )
      : null;
    return { ...c, match };
  });

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/empregos/empresa" className="text-sm text-terra-600 hover:text-terra-800">
            ← Voltar ao painel de {empresa.nome_empresa}
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">Candidaturas — {job.titulo}</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-3">
        {candidaturas.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-8 text-center text-sm text-terra-600">
            Ainda não há candidaturas para esta vaga.
          </p>
        )}

        {candidaturas.map((c) => (
          <div key={c.id} className="rounded-xl border border-terra-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-terra-900">
                  {c.candidato?.display_name || c.candidato?.username || "Candidato"}
                </p>
                <p className="text-xs text-terra-500">
                  Candidatou-se em {new Date(c.created_at).toLocaleDateString("pt-PT")}
                  {!c.match && " · perfil não público, sem dados de compatibilidade"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {c.match?.score != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      c.match.score >= 70
                        ? "bg-green-100 text-green-700"
                        : c.match.score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-terra-100 text-terra-600"
                    }`}
                    title="Compatibilidade com esta vaga, calculada a partir do perfil de candidato"
                  >
                    {c.match.score}% compatível
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COR[c.estado] ?? ""}`}>
                  {ESTADO_LABEL[c.estado] ?? c.estado}
                </span>
              </div>
            </div>

            {c.mensagem && (
              <p className="mt-2 rounded-lg bg-terra-50 p-3 text-sm text-terra-700">{c.mensagem}</p>
            )}

            {c.estado !== "retirada" && (
              <form action={atualizarEstadoCandidatura} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="application_id" value={c.id} />
                <select
                  name="estado"
                  defaultValue={ESTADOS_ATRIBUIVEIS.includes(c.estado) ? c.estado : "em_analise"}
                  className="rounded-lg border p-2 text-sm"
                >
                  {ESTADOS_ATRIBUIVEIS.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_LABEL[e]}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm">
                  Atualizar estado
                </Button>
              </form>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
