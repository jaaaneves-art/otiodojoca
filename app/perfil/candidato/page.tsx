import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidateProfileForm } from "@/components/candidatos/candidate-profile-form";
import type { SelectedSkill } from "@/components/candidatos/skills-picker";

export default async function CandidateProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: candidateProfile }, { data: candidateSkillsRows }, { data: municipios }, { data: skillsCatalog }] =
    await Promise.all([
      supabase.from("candidate_profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("candidate_skills")
        .select("skill_id, nivel, skills(nome)")
        .eq("candidate_id", user.id),
      supabase
        .from("municipios")
        .select("id, nome, distrito_regiao")
        .order("nome"),
      supabase.from("skills").select("id, nome").order("nome"),
    ]);

  type CandidateSkillRow = {
    skill_id: number;
    nivel: string;
    skills: { nome: string } | null;
  };

  const initialSkills: SelectedSkill[] = (
    (candidateSkillsRows ?? []) as CandidateSkillRow[]
  ).map((row) => ({
    skill_id: row.skill_id,
    nivel: row.nivel,
    nome: row.skills?.nome ?? "",
  }));

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-terra-800">Perfil de candidato</h1>
          <p className="text-sm text-terra-600">
            Usado para te candidatares a vagas no Empregos (JobNex) e para as
            empresas te encontrarem, se tornares o perfil público.
          </p>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-6">
        <CandidateProfileForm
          userId={user.id}
          initialProfile={candidateProfile}
          initialSkills={initialSkills}
          municipios={municipios ?? []}
          skillsCatalog={skillsCatalog ?? []}
        />
      </main>
    </div>
  );
}
