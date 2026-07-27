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
  | "wantsToReceive";

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
};

export const DEFAULT_AD_TYPE = "sale";

export function getAdType(id: string): AdTypeConfig {
  return AD_TYPES[id] ?? AD_TYPES[DEFAULT_AD_TYPE];
}

