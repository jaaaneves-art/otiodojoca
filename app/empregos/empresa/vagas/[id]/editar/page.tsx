import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { JobForm } from "@/components/empregos/job-form";
import type { JobSkillValue } from "@/components/empregos/job-skills-input";

interface JobSkillInput {
  skill_id: number;
  obrigatoria: boolean;
}

// skills(nome) é uma relação embutida (FK) -- o Supabase às vezes tipa-a como
// objeto único, às vezes como array de um elemento (mesmo problema já
// documentado em app/admin/entidades/page.tsx e app/empregos/page.tsx).
// Normalizamos aqui para sempre objeto ou null.
function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return (rel[0] as T) ?? null;
  return (rel as T) ?? null;
}

export default async function EditarVagaPage({
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
      `id, titulo, descricao, categoria, modalidade, tipo_contrato,
       nivel_experiencia, nivel_formacao_minimo, salario_min, salario_max,
       municipio_id, estado,
       empregos_empresas!inner ( id, profile_id, nome_empresa ),
       municipios ( nome, distrito_regiao )`
    )
    .eq("id", id)
    .single();

  if (error || !job) {
    notFound();
  }

  type EmpresaRel = { id: number; profile_id: string; nome_empresa: string };
  type MunicipioRel = { nome: string; distrito_regiao: string } | null;

  const empresa = (
    Array.isArray(job.empregos_empresas) ? job.empregos_empresas[0] : job.empregos_empresas
  ) as EmpresaRel;
  const municipio = (
    Array.isArray(job.municipios) ? job.municipios[0] : job.municipios
  ) as MunicipioRel;

  if (empresa.profile_id !== user.id) {
    redirect("/empregos/empresa");
  }

  const { data: jobSkillsRows } = await supabase
    .from("job_skills")
    .select("skill_id, obrigatoria, skills(nome)")
    .eq("job_id", job.id);

  type JobSkillRow = {
    skill_id: number;
    obrigatoria: boolean;
    skills: { nome: string } | { nome: string }[] | null;
  };
  const jobSkills: JobSkillValue[] = ((jobSkillsRows ?? []) as JobSkillRow[]).map((row) => ({
    skill_id: row.skill_id,
    obrigatoria: row.obrigatoria,
    nome: unwrap<{ nome: string }>(row.skills)?.nome ?? "",
  }));

  async function atualizarVaga(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Não autenticado");
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
    const jobSkillsRaw = (formData.get("job_skills_json") as string) || "[]";

    if (!municipioIdRaw) {
      throw new Error("Escolhe um município a partir das sugestões da lista.");
    }

    let novasSkills: JobSkillInput[] = [];
    try {
      novasSkills = JSON.parse(jobSkillsRaw);
    } catch {
      novasSkills = [];
    }

    // RLS ("Empresa gere as suas vagas") já garante que só o dono da
    // empresa consegue atualizar — mesmo assim o .select().single() a
    // seguir transforma um bloqueio silencioso em erro explícito, mesma
    // disciplina de app/admin/entidades/actions.ts e vagas/actions.ts.
    const { data: updated, error: updateError } = await supabase
      .from("jobs")
      .update({
        titulo,
        descricao,
        categoria,
        modalidade,
        tipo_contrato: tipoContrato,
        nivel_experiencia: nivelExperiencia,
        nivel_formacao_minimo: nivelFormacaoMinimo,
        salario_min: salarioMinRaw ? parseFloat(salarioMinRaw) : null,
        salario_max: salarioMaxRaw ? parseFloat(salarioMaxRaw) : null,
        municipio_id: parseInt(municipioIdRaw, 10),
      })
      .eq("id", id)
      .select("id")
      .single();

    if (updateError || !updated) {
      throw new Error(
        "Não foi possível atualizar a vaga — ou já não és o dono, ou algo correu mal. " +
          (updateError?.message ?? "")
      );
    }

    // Competências: apaga tudo e reinsere — mesma abordagem do
    // candidate-profile-form.tsx (mais simples que comparar diferenças).
    await supabase.from("job_skills").delete().eq("job_id", id);

    if (novasSkills.length > 0) {
      const { error: skillsError } = await supabase.from("job_skills").insert(
        novasSkills.map((s) => ({
          job_id: Number(id),
          skill_id: s.skill_id,
          obrigatoria: s.obrigatoria,
        }))
      );
      if (skillsError) {
        console.error("Erro ao atualizar competências da vaga:", skillsError);
      }
    }

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
          <h1 className="text-xl font-bold text-terra-800 mt-1">Editar vaga</h1>
          <p className="text-sm text-terra-600">{job.titulo}</p>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto p-6">
        <JobForm
          municipios={municipios ?? []}
          skillsCatalog={skillsCatalog ?? []}
          action={atualizarVaga}
          modo="editar"
          inicial={{
            titulo: job.titulo,
            descricao: job.descricao,
            categoria: job.categoria,
            modalidade: job.modalidade,
            tipo_contrato: job.tipo_contrato,
            nivel_experiencia: job.nivel_experiencia,
            nivel_formacao_minimo: job.nivel_formacao_minimo,
            salario_min: job.salario_min,
            salario_max: job.salario_max,
            municipio_id: job.municipio_id,
            municipio_label: municipio ? `${municipio.nome}, ${municipio.distrito_regiao}` : "",
            job_skills: jobSkills,
          }}
        />
      </main>
    </div>
  );
}
