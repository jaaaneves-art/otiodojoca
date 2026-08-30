import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

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

const ESTADOS_RETIRAVEIS = ["submetida", "em_analise", "entrevista", "selecionada"];

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function MinhasCandidaturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function retirarCandidatura(id: number) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("A tua sessão expirou. Entra novamente e tenta outra vez.");
    }

    // Mesmo padrão defensivo de app/empregos/empresa/vagas/actions.ts: o
    // .select().single() a seguir ao update transforma um bloqueio
    // silencioso da RLS ("Candidato gere as suas candidaturas", auth.uid()
    // = candidate_id) num erro explícito.
    const { data, error } = await supabase
      .from("applications")
      .update({ estado: "retirada" })
      .eq("id", id)
      .eq("candidate_id", user.id)
      .neq("estado", "retirada")
      .select("id, job_id")
      .single();

    if (error || !data) {
      throw new Error(
        "Não foi possível retirar a candidatura — já pode ter sido retirada antes. " +
          (error?.message ?? "")
      );
    }

    await supabase.from("application_events").insert({
      application_id: id,
      estado: "retirada",
      autor_id: user.id,
    });

    // Notificar a empresa -- notifications só aceita insert via service
    // role ("Sistema cria notificacoes", to service_role).
    const { data: jobRow } = await supabase
      .from("jobs")
      .select("titulo, empregos_empresas(profile_id)")
      .eq("id", data.job_id)
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
        message: `Uma candidatura para "${jobRow?.titulo ?? "a vaga"}" foi retirada`,
        link: `/empregos/empresa/vagas/${data.job_id}/candidaturas`,
      });
    }

    revalidatePath("/empregos/candidaturas");
  }

  type CandidaturaRow = {
    id: number;
    estado: string;
    mensagem: string | null;
    created_at: string;
    jobs:
      | { id: number; titulo: string; empregos_empresas: { nome_empresa: string } | { nome_empresa: string }[] | null }
      | { id: number; titulo: string; empregos_empresas: { nome_empresa: string } | { nome_empresa: string }[] | null }[]
      | null;
  };

  const { data: candidaturasData } = await supabase
    .from("applications")
    .select(
      `id, estado, mensagem, created_at,
       jobs ( id, titulo, empregos_empresas ( nome_empresa ) )`
    )
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const candidaturas = ((candidaturasData ?? []) as CandidaturaRow[]).map((c) => {
    const job = unwrap<{
      id: number;
      titulo: string;
      empregos_empresas: { nome_empresa: string } | { nome_empresa: string }[] | null;
    }>(c.jobs);
    const empresa = job ? unwrap<{ nome_empresa: string }>(job.empregos_empresas) : null;
    return { ...c, job, empresaNome: empresa?.nome_empresa ?? "Empresa" };
  });

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/empregos" className="text-sm text-terra-600 hover:text-terra-800">
            ← Empregos
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">As minhas candidaturas</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-3">
        {candidaturas.length === 0 && (
          <p className="rounded-lg border border-terra-200 bg-white p-8 text-center text-sm text-terra-600">
            Ainda não te candidataste a nenhuma vaga.{" "}
            <Link href="/empregos" className="underline">
              Ver vagas disponíveis
            </Link>
          </p>
        )}

        {candidaturas.map((c) => (
          <div key={c.id} className="rounded-xl border border-terra-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={c.job ? `/empregos/${c.job.id}` : "#"}
                  className="font-semibold text-terra-900 hover:underline"
                >
                  {c.job?.titulo ?? "Vaga"}
                </Link>
                <p className="text-sm text-terra-600">{c.empresaNome}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COR[c.estado] ?? ""}`}>
                {ESTADO_LABEL[c.estado] ?? c.estado}
              </span>
            </div>
            <p className="mt-2 text-xs text-terra-500">
              Candidatura enviada em {new Date(c.created_at).toLocaleDateString("pt-PT")}
            </p>
            {c.mensagem && (
              <p className="mt-2 rounded-lg bg-terra-50 p-3 text-xs italic text-terra-600">
                &ldquo;{c.mensagem}&rdquo;
              </p>
            )}
            {ESTADOS_RETIRAVEIS.includes(c.estado) && (
              <form action={retirarCandidatura.bind(null, c.id)} className="mt-3">
                <Button type="submit" size="sm" variant="outline">
                  Retirar candidatura
                </Button>
              </form>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
