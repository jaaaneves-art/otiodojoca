// Definicao central dos tipos de anuncio do Mercado da Terra.
// Fonte unica de verdade: o formulario e o backend leem daqui.
// Adicionar um tipo novo = acrescentar uma entrada a AD_TYPES.

export type FieldName =
  | "title"
  | "description"
  | "categoryId"
  | "priceType"
  | "price"
  | "location"
  | "contactMethod"
  | "wantsToReceive"
  | "seeking"
  | "seeking_description";

export interface AdTypeConfig {
  id: string;            // valor guardado na coluna `type`
  label: string;        // nome mostrado ao utilizador
  fields: FieldName[];  // que campos aparecem, por ordem
  required: FieldName[]; // quais sao obrigatorios
}

export const AD_TYPES: Record<string, AdTypeConfig> = {
  sale: {
    id: "sale",
    label: "Venda",
    fields: ["title", "description", "categoryId", "priceType", "price", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
  },
  offer: {
    id: "offer",
    label: "Oferta",
    fields: ["title", "description", "categoryId", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
  },
  troca: {
    // Bug encontrado em 2026-08-27 (LACUNA-03): o label estava trocado
    // com "procura" (dizia "Procura" aqui). Já era um problema conhecido
    // -- ver o comentário em lib/gran-bazar/ad-types.ts, que
    // deliberadamente não repetiu esta inconsistência mas nunca chegou a
    // corrigir a original. Só o label foi corrigido; id e fields
    // mantidos tal como estavam (o id é o valor persistido em
    // marketplace_ads.type para anúncios já existentes -- mudar isso
    // precisaria de migração de dados, não só de código).
    id: "troca",
    label: "Troca",
    fields: ["title", "description", "categoryId", "priceType", "price", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "priceType", "price", "location", "contactMethod"],
  },
  procura: {
    id: "procura",
    label: "Procura",
    fields: ["title", "description", "categoryId", "seeking", "seeking_description", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "seeking", "seeking_description", "location", "contactMethod"],
  },
};

export const DEFAULT_AD_TYPE = "sale";

export function getAdType(id: string): AdTypeConfig {
  return AD_TYPES[id] ?? AD_TYPES[DEFAULT_AD_TYPE];
}

