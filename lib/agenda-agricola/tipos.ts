// lib/agenda-agricola/tipos.ts
// Tipos da Agenda Agrícola (Camada 2) — CORRIGIDO para schema real
// Ver sql/AGENDA_AGRICOLA.sql para o schema completo

export interface CulturaGuia {
  id: string; // UUID — CORRIGIDO (era number)
  nome: string;
  nome_cientifico: string | null;
  categoria: string;
  perene?: boolean;
  ciclo_dias_min: number | null;
  ciclo_dias_max: number | null;
  semeadura_fase_lunar: string | null;
  poda_fase_lunar: string | null;
  colheita_fase_lunar: string | null;
  meses_semeadura: string | null;
  meses_colheita: string | null;
  meses_poda?: string | null;
  temp_min_germinacao: number | null;
  temp_otima: number | null;
  humidade_ideal: string | null;
  descricao: string | null;
  dicas: string | null;
  associacoes_beneficas: string | null;
  criado_em?: string; // timestamp
  atualizado_em?: string; // timestamp
}

// CORRIGIDO: Estados actuais no DB
export type EstadoPlantacao =
  | "planejado"        // Plantação planeada, não iniciada
  | "em_crescimento"   // Planta em desenvolvimento
  | "em_producao"      // Produzindo/frutificando
  | "colhido"          // Colheita completada
  | "interrompido";    // Parado/cancelado

export const ESTADOS_ATIVOS: EstadoPlantacao[] = [
  "planejado",
  "em_crescimento",
  "em_producao",
];

export const PROXIMO_ESTADO: Partial<Record<EstadoPlantacao, EstadoPlantacao>> = {
  planejado: "em_crescimento",
  em_crescimento: "em_producao",
  em_producao: "colhido",
};

export const ESTADO_LABEL: Record<EstadoPlantacao, string> = {
  planejado: "Planeado",
  em_crescimento: "Em crescimento",
  em_producao: "Em produção",
  colhido: "Colhido",
  interrompido: "Interrompido",
};

// Fotografia em JSONB
export interface Fotografia {
  id: string; // UUID
  url: string;
  path: string; // Supabase Storage path
  descricao?: string;
  criada_em: string; // ISO timestamp
}

export interface Plantacao {
  id: number; // bigint
  utilizador_id: string; // UUID
  cultura_id: string; // UUID — CORRIGIDO (era number)
  localizacao_id?: number;
  local_nome: string | null;
  data_plantacao: string; // date (YYYY-MM-DD)
  data_colheita_prevista: string | null;
  data_colheita_real: string | null;
  estado: EstadoPlantacao; // CORRIGIDO (era valores errados)
  fenologia: string | null;
  fase_lunar_plantacao: string | null;
  temperatura_media_plantacao: number | null;
  humidade_media_plantacao: number | null;
  notas: string | null;
  fotografias: Fotografia[] | null; // CORRIGIDO (era string[], é JSONB)
  origem?: string; // "web", "mobile", "app"
  criado_em: string; // timestamp
  atualizado_em: string; // timestamp
}

export interface PlantacaoComCultura extends Plantacao {
  cultura: CulturaGuia;
}

// CORRIGIDO: Tipos de evento reais no DB
export type TipoEvento =
  | "plantacao"        // Plantação criada
  | "adubacao"         // Fertilizante aplicado
  | "rega"             // Regada
  | "poda"             // Podada
  | "colheita"         // Colhida
  | "problema"         // Problema/praga detectada
  | "observacao"       // Anotação geral
  | "fenologia";       // Mudança de estágio fenológico

export interface PlantacaoHistoricoItem {
  id: number; // bigint
  plantacao_id: number; // bigint
  evento: TipoEvento; // CORRIGIDO (era valores errados)
  valor_antigo: string | null; // audit trail
  valor_novo: string | null; // audit trail
  notas_utilizador: string | null;
  criado_em: string; // timestamp
}

// DTOs
export interface CriarPlantacaoInput {
  cultura_id: string; // UUID
  data_plantacao: string; // YYYY-MM-DD
  local_nome?: string;
  notas?: string;
}

export interface AtualizarPlantacaoInput {
  estado?: EstadoPlantacao;
  local_nome?: string;
  notas?: string;
  data_colheita_real?: string;
}

export interface AdicionarEventoInput {
  plantacao_id: number;
  evento: TipoEvento;
  valor_antigo?: string;
  valor_novo?: string;
  notas_utilizador?: string;
}
