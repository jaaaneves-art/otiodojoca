// lib/calendario/almanaque.ts
// Conteúdo do Almanaque Diário (santo, provérbio, agricultura, horta,
// natureza, astronomia) por dia do ano — lê lib/calendario/almanaque.json,
// gerado a partir de content/Almanaque_Diario_Completo.md por
// scripts/gerar-almanaque.mjs. Chave "MM-DD", independente do ano.

import almanaqueJson from "./almanaque.json";

export interface AlmanaqueDia {
  santo?: string[];
  efemerides?: string[];
  proverbio?: string[];
  agricultura?: string[];
  hortaJardim?: string[];
  natureza?: string[];
  astronomia?: string[];
  curiosidade?: string[];
}

const ALMANAQUE = almanaqueJson as Record<string, AlmanaqueDia>;

function chaveMMDD(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${mes}-${dia}`;
}

// Devolve o conteúdo do almanaque para o dia (mês+dia) da data indicada,
// ou null se não houver entrada (não deve acontecer para uma data real,
// incluindo 29 de fevereiro).
export function getAlmanaqueDia(data: Date): AlmanaqueDia | null {
  return ALMANAQUE[chaveMMDD(data)] ?? null;
}
