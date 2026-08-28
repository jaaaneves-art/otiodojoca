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
    // com "procura" (dizia "Procura" aqui) -- corrigido nesse dia.
    //
    // Segundo bug, também 2026-08-27: os campos aqui pediam preço
    // (priceType/price), como se "Troca" fosse uma segunda "Venda", sem
    // nenhuma forma de dizer o que se quer receber em troca.
    //
    // Primeira tentativa de correção reaproveitou "seeking"/
    // "seeking_description" (os campos da "Procura") -- rejeitada pelo
    // Yos: tornava "Troca" e "Procura" indistinguíveis uma da outra
    // (mesmo campo, mesmo texto "O que Procuro"). Corrigido usando
    // "wantsToReceive" -- campo próprio, que já estava reservado no tipo
    // FieldName acima mas nunca tinha sido usado em nenhuma entrada nem
    // desenhado no formulário. "Procura" (seeking/seeking_description)
    // fica completamente intocada.
    id: "troca",
    label: "Troca",
    fields: ["title", "description", "categoryId", "wantsToReceive", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "wantsToReceive", "location", "contactMethod"],
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

