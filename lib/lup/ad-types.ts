// Definição central dos tipos de anúncio do Lup.
// Fonte única de verdade: o formulário e a listagem leem daqui.
// Segue o mesmo padrão de lib/gran-bazar/ad-types.ts — ver esse ficheiro
// e docs/LUP.md para o histórico da convenção.
//
// O Lup nasceu do MVP "SobraCiclo" (economia circular de excedentes:
// comida para humanos, comida para animais, compostagem — "zero
// desperdício, três ciclos"). Ao contrário do Gran Bazar, não tem troca
// nem leilão — só "oferta" (doação gratuita), "venda" (preço simbólico,
// tipo "caixa surpresa") e "procura" (para quem precisa de recolher
// excedentes, ex: uma associação ou abrigo).

export type FieldName =
  | "title"
  | "description"
  | "categoryId"
  | "price"
  | "quantity"
  | "unit"
  | "kgEstimate"
  | "pickupStartsAt"
  | "pickupEndsAt"
  | "location"
  | "contactMethod";

export interface LupAdTypeConfig {
  id: string;
  label: string;
  icon: string;
  fields: FieldName[];
  required: FieldName[];
  /** Rótulo mostrado no cartão de anúncio em vez do preço, quando aplicável */
  cardHint?: string;
}

export const LUP_AD_TYPES: Record<string, LupAdTypeConfig> = {
  oferta: {
    id: "oferta",
    label: "Doação",
    icon: "🎁",
    fields: [
      "title", "description", "categoryId",
      "quantity", "unit", "kgEstimate", "pickupStartsAt", "pickupEndsAt",
      "location", "contactMethod",
    ],
    required: ["title", "description", "categoryId", "quantity", "unit", "pickupEndsAt", "location", "contactMethod"],
    cardHint: "Grátis",
  },
  venda: {
    id: "venda",
    label: "Venda simbólica",
    icon: "💶",
    fields: [
      "title", "description", "categoryId", "price",
      "quantity", "unit", "kgEstimate", "pickupStartsAt", "pickupEndsAt",
      "location", "contactMethod",
    ],
    required: ["title", "description", "categoryId", "price", "quantity", "unit", "pickupEndsAt", "location", "contactMethod"],
  },
  procura: {
    id: "procura",
    label: "Procura",
    icon: "🙋",
    fields: ["title", "description", "categoryId", "location", "contactMethod"],
    required: ["title", "description", "categoryId", "location", "contactMethod"],
    cardHint: "Procura",
  },
};

export const DEFAULT_LUP_AD_TYPE = "oferta";

export function getLupAdType(id: string): LupAdTypeConfig {
  return LUP_AD_TYPES[id] ?? LUP_AD_TYPES[DEFAULT_LUP_AD_TYPE];
}

// Slugs das 3 categorias fixas (ver migration 20260823030000_lup.sql) —
// úteis para código que precise de reconhecer uma delas sem ir à BD
// (ex: escolher um ícone por omissão num cartão sem categoria carregada).
export const LUP_CATEGORY_SLUGS = {
  humano: "lup-humano",
  animal: "lup-animal",
  compostagem: "lup-compostagem",
} as const;

// Estimativa simples de CO2 evitado a partir do peso indicado pelo autor
// do anúncio (kgEstimate). Não é uma medição científica — é só um número
// indicativo para dar sentido de impacto, na mesma linha do que o MVP
// SobraCiclo mostrava (kgSaved / co2Avoided). Fator médio citado com
// frequência para desperdício alimentar evitado: ~2.5 kg CO2e por kg.
export function estimarCo2Evitado(kgEstimate: number | null | undefined): number | null {
  if (kgEstimate == null || isNaN(kgEstimate) || kgEstimate <= 0) return null;
  return Math.round(kgEstimate * 2.5 * 10) / 10;
}
