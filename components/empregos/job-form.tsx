import { MunicipioIdInput } from "@/components/empregos/municipio-id-input";
import { JobSkillsInput, type JobSkillValue } from "@/components/empregos/job-skills-input";

interface MunicipioOpt {
  id: number;
  nome: string;
  distrito_regiao: string;
}

interface SkillOpt {
  id: number;
  nome: string;
}

interface JobInicial {
  titulo?: string;
  descricao?: string;
  categoria?: string | null;
  modalidade?: string;
  tipo_contrato?: string | null;
  nivel_experiencia?: string | null;
  nivel_formacao_minimo?: string | null;
  salario_min?: number | null;
  salario_max?: number | null;
  municipio_id?: number | null;
  municipio_label?: string;
  job_skills?: JobSkillValue[];
}

const MODALIDADE_OPCOES = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
];

const TIPO_CONTRATO_OPCOES = [
  { value: "", label: "Não especificado" },
  { value: "efetivo", label: "Contrato efetivo" },
  { value: "termo_certo", label: "Termo certo" },
  { value: "termo_incerto", label: "Termo incerto" },
  { value: "prestacao_servicos", label: "Prestação de serviços" },
  { value: "estagio", label: "Estágio" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
];

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
  { value: "sem_requisito", label: "Sem requisito" },
  { value: "ensino_basico", label: "Ensino básico" },
  { value: "ensino_secundario", label: "Ensino secundário" },
  { value: "licenciatura", label: "Licenciatura" },
  { value: "mestrado", label: "Mestrado" },
  { value: "doutoramento", label: "Doutoramento" },
];

/**
 * Formulário de vaga (jobs) — server component (sem "use client" próprio;
 * os pickers filhos é que são client). Segue o mesmo padrão de
 * components/viaturas/viatura-ad-form.tsx: <form action={action}> ligado
 * diretamente a uma server action passada pela página (novo/page.tsx ou
 * [id]/editar/page.tsx), sem estado controlado no próprio formulário.
 *
 * Modo "criar": duas submissões possíveis (rascunho ou publicar já),
 * feitas através de dois botões com name="estado" — a server action lê
 * formData.get("estado"). Modo "editar": um único botão, sem campo
 * "estado" — mudar o estado de uma vaga já publicada é feito à parte, no
 * painel (/empregos/empresa), não neste formulário.
 */
export function JobForm({
  municipios,
  skillsCatalog,
  action,
  inicial,
  modo,
}: {
  municipios: MunicipioOpt[];
  skillsCatalog: SkillOpt[];
  action: (formData: FormData) => void | Promise<void>;
  inicial?: JobInicial;
  modo: "criar" | "editar";
}) {
  return (
    <form action={action} className="bg-white p-6 rounded-xl border border-terra-200 space-y-4">
      <div>
        <label className="text-sm font-medium">Título da vaga *</label>
        <input
          name="titulo"
          required
          defaultValue={inicial?.titulo ?? ""}
          placeholder="Ex: Eletricista, Empregado de mesa, Contabilista..."
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea
          name="descricao"
          required
          rows={5}
          defaultValue={inicial?.descricao ?? ""}
          placeholder="Funções, requisitos, horário, benefícios..."
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Categoria / área</label>
        <input
          name="categoria"
          defaultValue={inicial?.categoria ?? ""}
          placeholder="Ex: Hotelaria, Construção, Tecnologia..."
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Modalidade *</label>
          <select
            name="modalidade"
            required
            defaultValue={inicial?.modalidade ?? "presencial"}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {MODALIDADE_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Tipo de contrato</label>
          <select
            name="tipo_contrato"
            defaultValue={inicial?.tipo_contrato ?? ""}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {TIPO_CONTRATO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Nível de experiência pedido</label>
          <select
            name="nivel_experiencia"
            defaultValue={inicial?.nivel_experiencia ?? ""}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {NIVEL_EXPERIENCIA_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Formação mínima pedida</label>
          <select
            name="nivel_formacao_minimo"
            defaultValue={inicial?.nivel_formacao_minimo ?? ""}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {NIVEL_FORMACAO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Salário mín. (€/mês)</label>
          <input
            name="salario_min"
            type="number"
            min="0"
            step="0.01"
            defaultValue={inicial?.salario_min ?? ""}
            placeholder="Ex: 900"
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Salário máx. (€/mês)</label>
          <input
            name="salario_max"
            type="number"
            min="0"
            step="0.01"
            defaultValue={inicial?.salario_max ?? ""}
            placeholder="Ex: 1200"
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      </div>
      <p className="text-xs text-terra-500 -mt-2">
        Valores indicados pela empresa — mostrados como facto, nunca como
        estimativa (ver docs/EMPREGOS.md secção 2, sobre a distinção
        salario_fonte).
      </p>

      <div>
        <label className="text-sm font-medium">Município *</label>
        <MunicipioIdInput
          municipios={municipios}
          valorInicialId={inicial?.municipio_id ?? null}
          valorInicialLabel={inicial?.municipio_label ?? ""}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Competências pedidas</label>
        <JobSkillsInput catalogo={skillsCatalog} valorInicial={inicial?.job_skills ?? []} />
      </div>

      {modo === "criar" ? (
        <div className="flex gap-3">
          <button
            type="submit"
            name="estado"
            value="rascunho"
            className="flex-1 bg-white border-2 border-terra-600 text-terra-600 font-medium py-3 px-4 rounded-lg hover:bg-terra-50"
          >
            Guardar rascunho
          </button>
          <button
            type="submit"
            name="estado"
            value="publicada"
            className="flex-1 bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700"
          >
            Publicar vaga
          </button>
        </div>
      ) : (
        <button
          type="submit"
          className="w-full bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700"
        >
          Guardar alterações
        </button>
      )}
    </form>
  );
}
