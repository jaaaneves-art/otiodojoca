// lib/agenda-agricola/tipos.ts
// Tipos da Agenda Agrícola (Camada 2). Ver sql/AGENDA_AGRICOLA.sql para o schema.

export interface CulturaGuia {
  id: number;
  nome: string;
  nome_cientifico: string | null;
  categoria: string;
  perene: boolean;
  ciclo_dias_min: number | null;
  ciclo_dias_max: number | null;
  semeadura_fase_lunar: string | null; // "crescente" | "minguante" | "qualquer" | null
  poda_fase_lunar: string | null;
  colheita_fase_lunar: string | null;
  meses_semeadura: string | null;
  meses_colheita: string | null;
  meses_poda: string | null;
  temp_min_germinacao: number | null;
  temp_otima: number | null;
  humidade_ideal: string | null;
  descricao: string | null;
  dicas: string | null;
  associacoes_beneficas: string | null;
}

export type EstadoPlantacao =
  | "plantada"
  | "germinada"
  | "em_crescimento"
  | "florada"
  | "colhida"
  | "cancelada";

export const ESTADOS_ATIVOS: EstadoPlantacao[] = [
  "plantada",
  "germinada",
  "em_crescimento",
  "florada",
];

export const PROXIMO_ESTADO: Partial<Record<EstadoPlantacao, EstadoPlantacao>> = {
  plantada: "germinada",
  germinada: "em_crescimento",
  em_crescimento: "florada",
  florada: "colhida",
};

export const ESTADO_LABEL: Record<EstadoPlantacao, string> = {
  plantada: "Plantada",
  germinada: "Germinada",
  em_crescimento: "Em crescimento",
  florada: "Em floração",
  colhida: "Colhida",
  cancelada: "Cancelada",
};

export interface Plantacao {
  id: number;
  user_id: string;
  cultura_id: number;
  local_nome: string | null;
  data_plantacao: string;
  data_colheita_prevista: string | null;
  data_colheita_real: string | null;
  estado: EstadoPlantacao;
  fase_lunar_plantacao: string | null;
  temperatura_media_plantacao: number | null;
  humidade_media_plantacao: number | null;
  notas: string | null;
  fotografias: string[];
  created_at: string;
  updated_at: string;
}

export interface PlantacaoComCultura extends Plantacao {
  cultura: CulturaGuia;
}

export type EventoHistorico =
  | "estado_alterado"
  | "nota_adicionada"
  | "foto_adicionada"
  | "colhida";

export interface PlantacaoHistoricoItem {
  id: number;
  plantacao_id: number;
  evento: EventoHistorico;
  valor_antigo: string | null;
  valor_novo: string | null;
  notas_utilizador: string | null;
  created_at: string;
}
