"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MunicipioPicker } from "@/components/candidatos/municipio-picker";
import { SkillsPicker, type SelectedSkill } from "@/components/candidatos/skills-picker";

interface CandidateProfile {
  profissao: string | null;
  resumo: string | null;
  nivel_experiencia: string | null;
  nivel_formacao: string | null;
  disponibilidade: string;
  pretensao_salarial_min: number | null;
  pretensao_salarial_max: number | null;
  disponivel_mudanca_residencia: boolean;
  disponivel_viajar: boolean;
  municipio_id: number | null;
  perfil_publico: boolean;
}

interface MunicipioOpt {
  id: number;
  nome: string;
  distrito_regiao: string;
}

interface SkillOpt {
  id: number;
  nome: string;
}

const NIVEL_EXPERIENCIA_OPCOES = [
  { value: "", label: "Não especificado" },
  { value: "sem_experiencia", label: "Sem experiência" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sénior" },
  { value: "especialista", label: "Especialista" },
];

const NIVEL_FORMACAO_OPCOES = [
  { value: "", label: "Não especificado" },
  { value: "ensino_basico", label: "Ensino básico" },
  { value: "ensino_secundario", label: "Ensino secundário" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "mestrado", label: "Mestrado" },
  { value: "doutoramento", label: "Doutoramento" },
  { value: "outro", label: "Outro" },
];

const DISPONIBILIDADE_OPCOES = [
  { value: "imediata", label: "Imediata" },
  { value: "aviso_previo", label: "Após aviso prévio" },
  { value: "a_combinar", label: "A combinar" },
];

export function CandidateProfileForm({
  userId,
  initialProfile,
  initialSkills,
  municipios,
  skillsCatalog,
}: {
  userId: string;
  initialProfile: CandidateProfile | null;
  initialSkills: SelectedSkill[];
  municipios: MunicipioOpt[];
  skillsCatalog: SkillOpt[];
}) {
  const initialMunicipioLabel = (() => {
    if (!initialProfile?.municipio_id) return "";
    const m = municipios.find((x) => x.id === initialProfile.municipio_id);
    return m ? `${m.nome}, ${m.distrito_regiao}` : "";
  })();

  const [form, setForm] = useState({
    profissao: initialProfile?.profissao ?? "",
    resumo: initialProfile?.resumo ?? "",
    nivel_experiencia: initialProfile?.nivel_experiencia ?? "",
    nivel_formacao: initialProfile?.nivel_formacao ?? "",
    disponibilidade: initialProfile?.disponibilidade ?? "a_combinar",
    pretensao_salarial_min:
      initialProfile?.pretensao_salarial_min?.toString() ?? "",
    pretensao_salarial_max:
      initialProfile?.pretensao_salarial_max?.toString() ?? "",
    disponivel_mudanca_residencia:
      initialProfile?.disponivel_mudanca_residencia ?? false,
    disponivel_viajar: initialProfile?.disponivel_viajar ?? false,
    perfil_publico: initialProfile?.perfil_publico ?? false,
  });
  const [municipioId, setMunicipioId] = useState<number | null>(
    initialProfile?.municipio_id ?? null
  );
  const [skills, setSkills] = useState<SelectedSkill[]>(initialSkills);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const parseSalario = (v: string) => {
      const n = Number(v.replace(",", "."));
      return v.trim() !== "" && !Number.isNaN(n) ? n : null;
    };

    const { error: profileError } = await supabase
      .from("candidate_profiles")
      .upsert({
        id: userId,
        profissao: form.profissao.trim() || null,
        resumo: form.resumo.trim() || null,
        nivel_experiencia: form.nivel_experiencia || null,
        nivel_formacao: form.nivel_formacao || null,
        disponibilidade: form.disponibilidade,
        pretensao_salarial_min: parseSalario(form.pretensao_salarial_min),
        pretensao_salarial_max: parseSalario(form.pretensao_salarial_max),
        disponivel_mudanca_residencia: form.disponivel_mudanca_residencia,
        disponivel_viajar: form.disponivel_viajar,
        municipio_id: municipioId,
        perfil_publico: form.perfil_publico,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      setLoading(false);
      setMessage("Erro ao guardar o perfil. Tenta novamente.");
      return;
    }

    // Competências: apaga tudo e reinsere — mais simples que comparar
    // diferenças, e o RLS já garante que só mexe nas do próprio candidato.
    const { error: deleteError } = await supabase
      .from("candidate_skills")
      .delete()
      .eq("candidate_id", userId);

    if (deleteError) {
      setLoading(false);
      setMessage("Perfil guardado, mas houve um erro a atualizar as competências.");
      return;
    }

    if (skills.length > 0) {
      const { error: skillsError } = await supabase.from("candidate_skills").insert(
        skills.map((s) => ({
          candidate_id: userId,
          skill_id: s.skill_id,
          nivel: s.nivel,
        }))
      );

      if (skillsError) {
        setLoading(false);
        setMessage("Perfil guardado, mas houve um erro a atualizar as competências.");
        return;
      }
    }

    setLoading(false);
    setMessage("Perfil de candidato atualizado com sucesso!");
    router.refresh();
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Perfil de candidato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Profissão</label>
            <Input
              value={form.profissao}
              onChange={(e) => setForm({ ...form, profissao: e.target.value })}
              placeholder="Ex: Eletricista, Contabilista, Empregado de mesa..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resumo</label>
            <textarea
              value={form.resumo}
              onChange={(e) => setForm({ ...form, resumo: e.target.value })}
              placeholder="Conta um pouco sobre a tua experiência e o que procuras..."
              rows={4}
              className="flex w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de experiência</label>
              <select
                value={form.nivel_experiencia}
                onChange={(e) =>
                  setForm({ ...form, nivel_experiencia: e.target.value })
                }
                className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
              >
                {NIVEL_EXPERIENCIA_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de formação</label>
              <select
                value={form.nivel_formacao}
                onChange={(e) =>
                  setForm({ ...form, nivel_formacao: e.target.value })
                }
                className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
              >
                {NIVEL_FORMACAO_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Município</label>
            <MunicipioPicker
              municipios={municipios}
              valorInicialLabel={initialMunicipioLabel}
              onChange={(id) => setMunicipioId(id)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Disponibilidade</label>
            <select
              value={form.disponibilidade}
              onChange={(e) =>
                setForm({ ...form, disponibilidade: e.target.value })
              }
              className="flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
            >
              {DISPONIBILIDADE_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pretensão salarial mín. (€/mês)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.pretensao_salarial_min}
                onChange={(e) =>
                  setForm({ ...form, pretensao_salarial_min: e.target.value })
                }
                placeholder="Ex: 900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pretensão salarial máx. (€/mês)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.pretensao_salarial_max}
                onChange={(e) =>
                  setForm({ ...form, pretensao_salarial_max: e.target.value })
                }
                placeholder="Ex: 1200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.disponivel_mudanca_residencia}
                onChange={(e) =>
                  setForm({
                    ...form,
                    disponivel_mudanca_residencia: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              Disponível para mudar de residência
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.disponivel_viajar}
                onChange={(e) =>
                  setForm({ ...form, disponivel_viajar: e.target.checked })
                }
                className="w-4 h-4"
              />
              Disponível para viajar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.perfil_publico}
                onChange={(e) =>
                  setForm({ ...form, perfil_publico: e.target.checked })
                }
                className="w-4 h-4"
              />
              Tornar o perfil visível a empresas (mesmo sem me candidatar)
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Competências</label>
            <SkillsPicker catalogo={skillsCatalog} value={skills} onChange={setSkills} />
          </div>

          {message && (
            <p
              className={`text-sm p-3 rounded-lg ${
                message.includes("sucesso")
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/perfil")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
