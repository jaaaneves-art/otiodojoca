import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JobForm } from "@/components/empregos/job-form";

interface JobSkillInput {
  skill_id: number;
  obrigatoria: boolean;
}

async function criarVaga(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado");
  }

  const { data: empresa, error: empresaError } = await supabase
    .from("empregos_empresas")
    .select("id, estado")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (empresaError || !empresa) {
    throw new Error(
      "Não foi possível encontrar a tua empresa. Regista-a primeiro em /parceiros/pedido/empregador."
    );
  }
  if (empresa.estado !== "aprovado") {
    throw new Error("A tua empresa ainda não está aprovada — aguarda a validação da equipa.");
  }

  const titulo = formData.get("titulo") as string;
  const descricao = formData.get("descricao") as string;
  const categoria = (formData.get("categoria") as string) || null;
  const modalidade = formData.get("modalidade") as string;
  const tipoContrato = (formData.get("tipo_contrato") as string) || null;
  const nivelExperiencia = (formData.get("nivel_experiencia") as string) || null;
  const nivelFormacaoMinimo = (formData.get("nivel_formacao_minimo") as string) || null;
  const salarioMinRaw = formData.get("salario_min") as string;
  const salarioMaxRaw = formData.get("salario_max") as string;
  const municipioIdRaw = formData.get("municipio_id") as string;
  const estadoEscolhido = (formData.get("estado") as string) || "rascunho";
  const jobSkillsRaw = (formData.get("job_skills_json") as string) || "[]";

  if (!municipioIdRaw) {
    throw new Error("Escolhe um município a partir das sugestões da lista.");
  }

  let jobSkills: JobSkillInput[] = [];
  try {
    jobSkills = JSON.parse(jobSkillsRaw);
  } catch {
    jobSkills = [];
  }

  const estadoFinal = estadoEscolhido === "publicada" ? "publicada" : "rascunho";

  // CORRIGIDO 13/09/2026 — deixou de fazer INSERT direto em jobs
  // (bloqueado por RLS desde 20260913040000_rls_refactor_jobs_rpc.sql) e
  // passou a chamar a RPC job_criar(), alargada em 20260913133544 com
  // nivel_formacao_minimo, municipio_id e escolha de estado — a versão
  // original da RPC não tinha estes parâmetros e fixava salario_fonte a
  // 'fornecido' (devia ser 'empresa', como este formulário sempre usou).
  const { data: jobId, error: jobError } = await supabase.rpc("job_criar", {
    p_empresa_id: empresa.id,
    p_titulo: titulo,
    p_descricao: descricao,
    p_categoria: categoria,
    p_modalidade: modalidade,
    p_tipo_contrato: tipoContrato,
    p_nivel_experiencia: nivelExperiencia,
    p_municipio_id: parseInt(municipioIdRaw, 10),
    p_nivel_formacao_minimo: nivelFormacaoMinimo,
    p_salario_min: salarioMinRaw ? parseFloat(salarioMinRaw) : null,
    p_salario_max: salarioMaxRaw ? parseFloat(salarioMaxRaw) : null,
    p_estado: estadoFinal,
  });

  if (jobError || !jobId) {
    throw new Error("Erro ao criar vaga: " + jobError?.message);
  }

  if (jobSkills.length > 0) {
    const { error: skillsError } = await supabase.from("job_skills").insert(
      jobSkills.map((s) => ({
        job_id: jobId,
        skill_id: s.skill_id,
        obrigatoria: s.obrigatoria,
      }))
    );
    if (skillsError) {
      // Vaga já ficou criada — não vale a pena travar o fluxo por causa das
      // competências, mas fica registado para depuração.
      console.error("Erro ao gravar competências da vaga:", skillsError);
    }
  }

  redirect("/empregos/empresa");
}

export default async function NovaVagaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: empresa } = await supabase
    .from("empregos_empresas")
    .select("id, estado, nome_empresa")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!empresa) {
    redirect("/empregos/empresa");
  }
  if (empresa.estado !== "aprovado") {
    redirect("/empregos/empresa");
  }

  const [{ data: municipios }, { data: skillsCatalog }] = await Promise.all([
    supabase.from("municipios").select("id, nome, distrito_regiao").order("nome"),
    supabase.from("skills").select("id, nome").order("nome"),
  ]);

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/empregos/empresa" className="text-terra-700 hover:text-terra-900 text-sm">
            ← Voltar ao painel de {empresa.nome_empresa}
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">Nova vaga</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto p-6">
        <JobForm
          municipios={municipios ?? []}
          skillsCatalog={skillsCatalog ?? []}
          action={criarVaga}
          modo="criar"
        />
      </main>
    </div>
  );
}
