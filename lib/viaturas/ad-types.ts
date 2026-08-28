// Definição central dos tipos de anúncio de Viaturas (StandGo).
// Fonte única de verdade: o formulário e a listagem leem daqui.
// Segue o mesmo padrão do lib/gran-bazar/ad-types.ts. Começou só com 2
// tipos (venda/leilao); em 28/08/2026 alargado a pedido do Yos ("comprar
// ceder e alugar") para cobrir também quem procura comprar, quem cede a
// viatura (grátis/valor simbólico) e aluguer de curta duração.
//
// "leilao" reaproveita o mesmo motor de leilões do Gran Bazar
// (marketplace_ads / gran_bazar_place_bid / gran_bazar_advance_auctions)
// — ver docs/VIATURAS.md, secção 3, e a migration
// 20260824000000_viaturas.sql para a alteração (mínima) que permitiu isto.

export type FieldName =
  | "title"
  | "description"
  | "categoryId"
  | "priceType"
  | "price"
  | "location"
  | "contactMethod"
  | "marca"
  | "modelo"
  | "ano"
  | "quilometros"
  | "combustivel"
  | "caixa"
  | "cor"
  | "potencia"
  | "condicao"
  | "tipoVendedor"
  | "auctionStartPrice"
  | "auctionMinIncrement"
  | "auctionStartsAt"
  | "auctionEndsAt"
  | "budget"
  | "precoDia"
  | "preco3Dias"
  | "precoSemana"
  | "preco2Semanas"
  | "precoMes"
  | "caucao"
  | "seguroIncluido";

export interface ViaturaAdTypeConfig {
  id: string;
  label: string;
  icon: string;
  fields: FieldName[];
  required: FieldName[];
  /** Rótulo mostrado no cartão de anúncio em vez do preço, quando aplicável */
  cardHint?: string;
}

export const VIATURAS_AD_TYPES: Record<string, ViaturaAdTypeConfig> = {
  venda: {
    id: "venda",
    label: "Venda",
    icon: "💰",
    fields: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao", "cor", "potencia", "tipoVendedor",
      "priceType", "price", "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao",
      "location", "contactMethod",
    ],
  },
  leilao: {
    id: "leilao",
    label: "Leilão",
    icon: "🔨",
    fields: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao", "cor", "potencia", "tipoVendedor",
      "auctionStartPrice", "auctionMinIncrement", "auctionStartsAt", "auctionEndsAt",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao",
      "auctionStartPrice", "auctionEndsAt",
      "location", "contactMethod",
    ],
    cardHint: "Leilão",
  },
  comprar: {
    id: "comprar",
    label: "Procuro Comprar",
    icon: "🔍",
    fields: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao", "cor", "potencia",
      "budget",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "location", "contactMethod",
    ],
    cardHint: "Procura",
  },
  ceder: {
    id: "ceder",
    label: "Ceder",
    icon: "🤝",
    fields: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao", "cor", "potencia", "tipoVendedor",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao",
      "location", "contactMethod",
    ],
    cardHint: "Grátis",
  },
  alugar: {
    id: "alugar",
    label: "Alugar",
    icon: "🔑",
    fields: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao", "cor", "potencia", "tipoVendedor",
      "precoDia", "preco3Dias", "precoSemana", "preco2Semanas", "precoMes", "caucao", "seguroIncluido",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "marca", "modelo", "ano", "quilometros", "combustivel", "caixa", "condicao",
      "precoDia",
      "location", "contactMethod",
    ],
    cardHint: "Aluguer",
  },
};

export const DEFAULT_VIATURA_AD_TYPE = "venda";

export function getViaturaAdType(id: string): ViaturaAdTypeConfig {
  return VIATURAS_AD_TYPES[id] ?? VIATURAS_AD_TYPES[DEFAULT_VIATURA_AD_TYPE];
}

export const COMBUSTIVEL_OPCOES = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"] as const;
export const CAIXA_OPCOES = ["Manual", "Automática"] as const;
export const CONDICAO_OPCOES = ["Novo", "Usado"] as const;
export const TIPO_VENDEDOR_OPCOES = ["Particular", "Stand"] as const;
export const SEGURO_OPCOES = ["Incluído", "Não incluído", "Opcional / a combinar"] as const;
