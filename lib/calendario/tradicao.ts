// lib/calendario/tradicao.ts
// Sabedoria tradicional portuguesa sobre a lua e a agricultura.
// Fonte: documentos internos do projeto sobre o Calendário Lunar Português.
// NOTA: tradição cultural, não regra científica comprovada.

import type { FaseLua } from "./lua";

export interface TradicaoFase {
  fazer: string[];
  evitar: string[];
  resumo: string;
}

// O que a tradição recomenda fazer/evitar em cada fase.
// As 8 fases agrupam-se nas 4 principais para efeitos de recomendação.
export const TRADICAO: Record<FaseLua, TradicaoFase> = {
  nova: {
    resumo: "Tempo de preparação e limpeza.",
    fazer: [
      "Preparar e cavar o solo",
      "Fazer composto",
      "Arrancar ervas daninhas",
      "Limpeza geral da horta",
    ],
    evitar: ["Grandes sementeiras", "Podas importantes"],
  },
  crescente: {
    resumo: "A seiva sobe — crescimento das partes aéreas.",
    fazer: [
      "Semear folhosas (alface, couve, espinafre)",
      "Semear frutos (tomate, pepino, curgete)",
      "Semear flores e cereais",
      "Regar abundantemente",
    ],
    evitar: ["Podar árvores de fruto"],
  },
  quarto_crescente: {
    resumo: "Boa fase para plantar e enxertar.",
    fazer: [
      "Plantar folhosas e frutos",
      "Enxertias (recuperação de árvores)",
      "Semear cereais e flores",
    ],
    evitar: ["Podas fortes"],
  },
  gibosa_crescente: {
    resumo: "Vigor de crescimento antes da lua cheia.",
    fazer: [
      "Semear e plantar frutos e folhosas",
      "Regar com regularidade",
    ],
    evitar: ["Podar árvores de fruto"],
  },
  cheia: {
    resumo: "Frutos mais suculentos — tempo de colher.",
    fazer: [
      "Colher frutos",
      "Colher para conservação de sementes",
      "Plantar flores",
    ],
    evitar: ["Transplantar", "Grandes podas"],
  },
  gibosa_minguante: {
    resumo: "A seiva desce — início da fase descendente.",
    fazer: [
      "Colher raízes e tubérculos",
      "Controlo preventivo de pragas",
      "Preparar transplantes",
    ],
    evitar: ["Semear folhosas"],
  },
  quarto_minguante: {
    resumo: "Seiva nas raízes — ideal para podar.",
    fazer: [
      "Podar (videira, oliveira, fruteiras)",
      "Transplantar",
      "Plantar raízes (batata, cenoura, cebola, alho)",
    ],
    evitar: ["Plantar folhas e frutos"],
  },
  minguante: {
    resumo: "Época de repouso — raízes e podas.",
    fazer: [
      "Plantar raízes e tubérculos",
      "Podas e transplantes",
      "Controlo de infestantes",
    ],
    evitar: ["Semear plantas de folha e de fruto"],
  },
};

// Que tipo de cultura favorece cada grupo de fase
export interface FavorecePorTipo {
  tipo: string;
  faseIdeal: string;
  exemplos: string;
}

export const SEMEAR_POR_TIPO: FavorecePorTipo[] = [
  { tipo: "Folhosas", faseIdeal: "Crescente", exemplos: "alface, espinafre, couve, brócolo, salsa, rúcula, acelga" },
  { tipo: "Frutos", faseIdeal: "Crescente", exemplos: "tomate, pimento, pepino, curgete, abóbora, feijão, milho" },
  { tipo: "Raízes / Tubérculos", faseIdeal: "Minguante", exemplos: "cenoura, beterraba, batata, cebola, alho, nabo, rabanete" },
  { tipo: "Flores", faseIdeal: "Crescente", exemplos: "bolbos de primavera/verão e a maioria das flores" },
  { tipo: "Cereais", faseIdeal: "Crescente", exemplos: "trigo, centeio, cevada, aveia" },
];

// Ajustes por região
export interface Regiao {
  id: "norte" | "centro" | "sul";
  nome: string;
  ajuste: string;
}

export const REGIOES: Regiao[] = [
  { id: "norte", nome: "Norte", ajuste: "Atrasar sementeiras de primavera/verão 1–2 semanas (geadas mais tardias)." },
  { id: "centro", nome: "Centro", ajuste: "Seguir o calendário base sem grandes ajustes." },
  { id: "sul", nome: "Sul", ajuste: "Adiantar sementeiras 1–2 semanas (sem geadas severas)." },
];

// Aviso de rigor a mostrar sempre
export const NOTA_CIENTIFICA =
  "A agricultura lunar faz parte do património cultural português e baseia-se na " +
  "observação empírica acumulada durante séculos. Não existe prova científica sólida " +
  "de que as fases da lua influenciem a germinação ou o crescimento das plantas — os " +
  "fatores determinantes são o clima, o solo, a água e a luz solar. Use este calendário " +
  "como guia tradicional e complementar, não como regra absoluta.";
