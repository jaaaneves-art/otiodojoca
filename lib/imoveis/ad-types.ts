// Definição central dos tipos de anúncio do módulo Imóveis.
// Fonte única de verdade: o formulário e a listagem leem daqui.
// Segue o mesmo padrão de lib/gran-bazar/ad-types.ts e lib/lup/ad-types.ts —
// ver esses ficheiros e docs/IMOVEIS.md para o histórico da convenção.
//
// Só dois tipos de anúncio, deliberadamente mais simples que o Gran Bazar:
// "venda" (preço fixo) e "leilao" (reaproveita a coluna marketplace_ads.type
// já existente, sem CHECK a restringir valores — ver
// supabase/migrations/20260824010000_imoveis.sql, que alarga o mesmo
// trigger/place_bid/advance_auctions do Gran Bazar em vez de duplicar o
// motor de leilões). Sem troca, oferta nem procura — não fazem sentido para
// um imóvel dentro do âmbito pedido (ver
// claude/AUDITORIA-LUP-IMOVEIS-20260824.md: "não inventar funcionalidades
// fora do âmbito").
//
// Os campos próprios do imóvel (área, quartos, WC, ano, estado) aplicam-se
// aos DOIS tipos — um imóvel em leilão continua a ter área e quartos — por
// isso não fazem parte da distinção "fields" por tipo como os campos de
// leilão fazem; entram sempre, ver PROPERTY_FIELDS abaixo.

export type FieldName =
  | "title"
  | "description"
  | "categoryId"
  | "priceType"
  | "price"
  | "area"
  | "bedrooms"
  | "bathrooms"
  | "yearBuilt"
  | "propertyCondition"
  | "location"
  | "contactMethod"
  | "auctionStartPrice"
  | "auctionMinIncrement"
  | "auctionStartsAt"
  | "auctionEndsAt";

export interface ImovelAdTypeConfig {
  id: string;
  label: string;
  icon: string;
  fields: FieldName[];
  required: FieldName[];
  /** Rótulo mostrado no cartão de anúncio em vez do preço, quando aplicável */
  cardHint?: string;
}

// Campos do imóvel em si — sempre presentes, independentemente do tipo de
// anúncio (venda ou leilão). Só "área" é obrigatória; os restantes ficam
// como opcionais tal como no MVP original (bedrooms?/bathrooms?/yearBuilt?).
const PROPERTY_FIELDS: FieldName[] = ["area", "bedrooms", "bathrooms", "yearBuilt", "propertyCondition"];
const PROPERTY_REQUIRED: FieldName[] = ["area", "propertyCondition"];

export const IMOVEL_AD_TYPES: Record<string, ImovelAdTypeConfig> = {
  venda: {
    id: "venda",
    label: "Venda",
    icon: "💰",
    fields: ["title", "description", "categoryId", "priceType", "price", ...PROPERTY_FIELDS, "location", "contactMethod"],
    required: ["title", "description", "categoryId", "price", ...PROPERTY_REQUIRED, "location", "contactMethod"],
  },
  leilao: {
    id: "leilao",
    label: "Leilão",
    icon: "🔨",
    fields: [
      "title", "description", "categoryId",
      ...PROPERTY_FIELDS,
      "auctionStartPrice", "auctionMinIncrement", "auctionStartsAt", "auctionEndsAt",
      "location", "contactMethod",
    ],
    required: [
      "title", "description", "categoryId",
      ...PROPERTY_REQUIRED,
      "auctionStartPrice", "auctionEndsAt",
      "location", "contactMethod",
    ],
    cardHint: "Leilão",
  },
};

export const DEFAULT_IMOVEL_AD_TYPE = "venda";

export function getImovelAdType(id: string): ImovelAdTypeConfig {
  return IMOVEL_AD_TYPES[id] ?? IMOVEL_AD_TYPES[DEFAULT_IMOVEL_AD_TYPE];
}

// Estado de conservação do imóvel — guardado em details.condition.
export const PROPERTY_CONDITIONS = {
  novo: "Novo",
  usado: "Usado",
  remodelado: "Remodelado",
  em_construcao: "Em construção",
} as const;

export type PropertyCondition = keyof typeof PROPERTY_CONDITIONS;

export function propertyConditionLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return PROPERTY_CONDITIONS[value as PropertyCondition] ?? value;
}
