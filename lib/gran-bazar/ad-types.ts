// Definição central dos tipos de anúncio do Gran Bazar.
// Fonte única de verdade: o formulário e a listagem leem daqui.
// Nota: os ids usam nomes em português (venda/troca/oferta/procura), ao
// contrário do Mercado da Terra que mistura inglês/português (sale/offer/
// troca/procura) e tem os labels de "troca"/"procura" trocados entre si —
// aqui optámos por não repetir essa inconsistência.
//
// "leilao" reaproveita a coluna marketplace_ads.type já existente (não tem
// nenhum CHECK a restringir valores, por isso 'leilao' já era um valor
// válido) — ver docs/GRAN-BAZAR.md, secção "Leilões", e a migration
// 20260823000000_gran_bazar_leiloes_ativos.sql para o trigger que cria a
// linha em marketplace_auctions a partir dos campos auctionStartPrice/
// auctionMinIncrement/auctionStartsAt/auctionEndsAt abaixo.

export type FieldName =
  | "title"
  | "description"
  | "categoryId"
  | "priceType"
  | "price"
  | "location"
  | "contactMethod"
  | "seeking"
  | "auctionStartPrice"
  | "auctionMinIncrement"
  | "auctionStartsAt"
  | "auctionEndsAt";

export interface BazarAdTypeConfig {
  id: string;
  label: string;
  icon: string;
  fields: FieldName[];
  required: FieldName[];
  /** Rótulo mostrado no cartão de anúncio em vez do preço, quando aplicável */
  cardHint?: string;
}

export const BAZAR_AD_TYPES: Record<string, BazarAdTypeConfig> = {
  venda: {
    id: "venda",
    label: "Venda",
    icon: "💰",
    fields: ["title", "description", "categoryId", "priceType", "price", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
  },
  troca: {
    id: "troca",
    label: "Troca",
    icon: "🔄",
    fields: ["title", "description", "categoryId", "seeking", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "seeking", "location", "contactMethod"],
  },
  oferta: {
    id: "oferta",
    label: "Oferta",
    icon: "🎁",
    fields: ["title", "description", "categoryId", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
    cardHint: "Grátis",
  },
  procura: {
    id: "procura",
    label: "Procura",
    icon: "🔍",
    fields: ["title", "description", "categoryId", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
  },
  leilao: {
    id: "leilao",
    label: "Leilão",
    icon: "🔨",
    fields: [
      "title", "description", "categoryId",
      "auctionStartPrice", "auctionMinIncrement", "auctionStartsAt", "auctionEndsAt",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      "auctionStartPrice", "auctionEndsAt",
      "location", "contactMethod",
    ],
    cardHint: "Leilão",
  },
};

export const DEFAULT_BAZAR_AD_TYPE = "venda";

export function getBazarAdType(id: string): BazarAdTypeConfig {
  return BAZAR_AD_TYPES[id] ?? BAZAR_AD_TYPES[DEFAULT_BAZAR_AD_TYPE];
}
