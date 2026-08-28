// Definição central dos tipos de anúncio do módulo Imóveis.
// Fonte única de verdade: o formulário e a listagem leem daqui.
// Segue o mesmo padrão de lib/gran-bazar/ad-types.ts e lib/lup/ad-types.ts —
// ver esses ficheiros e docs/IMOVEIS.md para o histórico da convenção.
//
// Seis tipos de anúncio (alargado em 28/08/2026 — ver
// claude/IMOVEIS-ARRENDAMENTO-PERMUTA-QUARTO-20260828.md no projeto Claude):
// "venda" e "leilao" (originais) mais "arrendamento", "permuta",
// "companhia" e "quarto". Tudo reaproveita a coluna marketplace_ads.type já
// existente, sem CHECK a restringir valores (só price_type tem CHECK, e
// esse continua a aceitar null para os tipos sem preço — permuta e
// companhia — tal como o "comprar" do StandGo).
//
// "companhia" = alojamento a troca de companhia/apoio (não é dinheiro que
// muda de mãos, ao contrário de arrendamento) — decisão deliberada de lhe
// dar tipo próprio em vez de o esconder dentro de permuta, por ter campos e
// significado social muito diferentes (ver pergunta direta ao Yos,
// resposta "Tipo próprio").
//
// "quarto" nasceu primeiro como categoria (tipo de imóvel) dentro de
// "arrendamento", mas o Yos pediu para passar a tipo de anúncio próprio —
// "devido à sua especificidade": arrendar um quarto tem perguntas que não
// fazem sentido nenhum para uma casa inteira (é privado ou partilhado, a
// casa de banho é partilhada, quantas pessoas já vivem lá, que comodidades
// tem a casa) e não tem outras que fazem sentido para uma casa inteira
// (estado de conservação, ano de construção). Por isso "quarto" NÃO
// reaproveita PROPERTY_FIELDS nem o campo categoryId — o formulário
// (imoveis-ad-form.tsx) mostra-lhe uma secção própria "🛏️ Detalhes do
// quarto", e o category_id é atribuído automaticamente no servidor à
// categoria "Quarto" já existente (slug imoveis-quarto), sem o utilizador
// ter de escolher. Ver COMODIDADES_QUARTO mais abaixo para as opções de
// comodidades da casa. Desenho informado por como Idealista/Uniplaces/
// Spotahome estruturam anúncios de quartos (tipo de quarto, casa de banho,
// nº de pessoas na casa, comodidades, regras da casa, mínimo de estadia) —
// evitámos deliberadamente campos de preferência por género/idade dos
// colegas de casa, que nalgumas plataformas existem mas que aqui não
// quisemos replicar.
//
// Os campos próprios do imóvel inteiro (área, quartos, WC, ano, estado)
// aplicam-se aos restantes cinco tipos — um imóvel em leilão continua a
// ter área e quartos — por isso não fazem parte da distinção "fields" por
// tipo como os campos de leilão/arrendamento/permuta/companhia fazem;
// entram sempre, ver PROPERTY_FIELDS abaixo. "quarto" é a exceção, como
// descrito acima.

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
  | "auctionEndsAt"
  | "mobilado"
  | "despesasIncluidas"
  | "caucao"
  | "disponivelDesde"
  | "duracaoMinima"
  | "paraEstudantes"
  | "vagasDisponiveis"
  | "procuraEmTroca"
  | "aceitaComDiferenca"
  | "apoioEsperado"
  | "regrasDaCasa"
  | "tipoQuarto"
  | "casaBanho"
  | "pessoasNaCasa"
  | "comodidades"
  | "aceitaCasais";

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
  arrendamento: {
    id: "arrendamento",
    label: "Arrendamento",
    icon: "🔑",
    fields: [
      "title", "description", "categoryId", "priceType", "price",
      ...PROPERTY_FIELDS,
      "mobilado", "despesasIncluidas", "caucao", "disponivelDesde", "duracaoMinima",
      "paraEstudantes", "vagasDisponiveis",
      "location", "contactMethod",
    ],
    required: ["title", "description", "categoryId", "price", ...PROPERTY_REQUIRED, "location", "contactMethod"],
  },
  quarto: {
    id: "quarto",
    label: "Quarto",
    icon: "🛏️",
    // Sem categoryId (atribuído automaticamente no servidor) nem
    // PROPERTY_FIELDS (estado/ano de construção não fazem sentido para um
    // quarto avulso) — ver o comentário grande no topo do ficheiro.
    fields: [
      "title", "description", "priceType", "price",
      "area", "bedrooms",
      "tipoQuarto", "casaBanho", "pessoasNaCasa", "mobilado", "comodidades",
      "despesasIncluidas", "caucao", "disponivelDesde", "duracaoMinima",
      "aceitaCasais", "regrasDaCasa", "paraEstudantes",
      "location", "contactMethod",
    ],
    required: ["title", "description", "price", "area", "tipoQuarto", "casaBanho", "location", "contactMethod"],
  },
  permuta: {
    id: "permuta",
    label: "Permuta",
    icon: "🔄",
    fields: [
      "title", "description", "categoryId",
      ...PROPERTY_FIELDS,
      "procuraEmTroca", "aceitaComDiferenca",
      "location", "contactMethod",
    ],
    required: ["title", "description", "categoryId", ...PROPERTY_REQUIRED, "procuraEmTroca", "location", "contactMethod"],
    cardHint: "Permuta",
  },
  companhia: {
    id: "companhia",
    label: "Troca por companhia",
    icon: "🤝",
    fields: [
      "title", "description", "categoryId",
      ...PROPERTY_FIELDS,
      "apoioEsperado", "regrasDaCasa", "duracaoMinima", "paraEstudantes",
      "location", "contactMethod",
    ],
    required: ["title", "description", "categoryId", ...PROPERTY_REQUIRED, "apoioEsperado", "location", "contactMethod"],
    cardHint: "Troca por companhia",
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

// Comodidades da casa para anúncios de tipo "quarto" — guardadas em
// details.comodidades como string separada por vírgulas (ex:
// "wifi,cozinha,maquina_lavar"), porque um <input type="checkbox"> de
// formulário HTML não tem forma nativa de representar um array em
// details (jsonb); "," é seguro porque nenhum dos values tem vírgula.
export const COMODIDADES_QUARTO = [
  { value: "wifi", label: "Wifi", icon: "📶" },
  { value: "cozinha", label: "Cozinha equipada", icon: "🍳" },
  { value: "maquina_lavar", label: "Máquina de lavar roupa", icon: "🧺" },
  { value: "aquecimento", label: "Aquecimento/AC", icon: "🌡️" },
  { value: "elevador", label: "Elevador", icon: "🛗" },
  { value: "varanda", label: "Varanda/terraço", icon: "🌇" },
  { value: "estacionamento", label: "Estacionamento", icon: "🚗" },
] as const;

export function comodidadeLabel(value: string): string {
  return COMODIDADES_QUARTO.find((c) => c.value === value)?.label ?? value;
}
