// lib/calendario/lua.ts
// Motor de cálculo das fases da lua. Sem internet, sem base de dados.
// Baseado no ciclo sinódico (29,53059 dias) a partir de uma lua nova de referência.

export type FaseLua =
  | "nova"
  | "crescente"
  | "quarto_crescente"
  | "gibosa_crescente"
  | "cheia"
  | "gibosa_minguante"
  | "quarto_minguante"
  | "minguante";

export interface InfoLua {
  fase: FaseLua;
  nome: string;
  simbolo: string;
  iluminacao: number; // 0..100 (%)
  idadeDias: number; // dias desde a última lua nova
}

const CICLO_SINODICO = 29.53058867;

// Lua nova de referência: 6 de janeiro de 2000, 18:14 UTC (JD 2451550.1)
const LUA_NOVA_REF = Date.UTC(2000, 0, 6, 18, 14, 0);

const DEFINICOES: Record<FaseLua, { nome: string; simbolo: string }> = {
  nova: { nome: "Lua Nova", simbolo: "🌑" },
  crescente: { nome: "Lua Crescente", simbolo: "🌒" },
  quarto_crescente: { nome: "Quarto Crescente", simbolo: "🌓" },
  gibosa_crescente: { nome: "Gibosa Crescente", simbolo: "🌔" },
  cheia: { nome: "Lua Cheia", simbolo: "🌕" },
  gibosa_minguante: { nome: "Gibosa Minguante", simbolo: "🌖" },
  quarto_minguante: { nome: "Quarto Minguante", simbolo: "🌗" },
  minguante: { nome: "Lua Minguante", simbolo: "🌘" },
};

// Idade da lua (dias desde a última lua nova) para uma data
export function idadeLua(data: Date): number {
  const diffDias = (data.getTime() - LUA_NOVA_REF) / 86400000;
  let idade = diffDias % CICLO_SINODICO;
  if (idade < 0) idade += CICLO_SINODICO;
  return idade;
}

// Determina a fase a partir da idade em dias
export function faseDaIdade(idade: number): FaseLua {
  const p = idade / CICLO_SINODICO; // 0..1
  // Janelas: fases principais (nova/quartos/cheia) ~2 dias cada
  if (p < 0.033 || p >= 0.967) return "nova";
  if (p < 0.217) return "crescente";
  if (p < 0.283) return "quarto_crescente";
  if (p < 0.467) return "gibosa_crescente";
  if (p < 0.533) return "cheia";
  if (p < 0.717) return "gibosa_minguante";
  if (p < 0.783) return "quarto_minguante";
  return "minguante";
}

// Percentagem de iluminação (0 nova, 100 cheia)
export function iluminacao(idade: number): number {
  const anguloFase = (2 * Math.PI * idade) / CICLO_SINODICO;
  const frac = (1 - Math.cos(anguloFase)) / 2;
  return Math.round(frac * 100);
}

export function infoLua(data: Date = new Date()): InfoLua {
  const idade = idadeLua(data);
  const fase = faseDaIdade(idade);
  const def = DEFINICOES[fase];
  return {
    fase,
    nome: def.nome,
    simbolo: def.simbolo,
    iluminacao: iluminacao(idade),
    idadeDias: Math.round(idade * 10) / 10,
  };
}

// Se a fase está a crescer (antes da cheia) ou a minguar (depois)
export function estaCrescente(fase: FaseLua): boolean {
  return ["nova", "crescente", "quarto_crescente", "gibosa_crescente"].includes(fase);
}
