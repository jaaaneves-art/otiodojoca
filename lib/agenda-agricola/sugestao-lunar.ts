// lib/agenda-agricola/sugestao-lunar.ts
// Cruza a fase lunar de hoje (lib/calendario/lua.ts) com a fase de
// sementeira recomendada de uma cultura, para a sugestão contextual do
// dashboard/ficha (critério de aceitação #8 da Camada 2).

import { estaCrescente, type FaseLua } from "@/lib/calendario/lua";
import type { CulturaGuia } from "./tipos";

export function faseSimplificada(fase: FaseLua): "crescente" | "minguante" {
  return estaCrescente(fase) ? "crescente" : "minguante";
}

export function sugestaoLunar(cultura: CulturaGuia, faseHoje: FaseLua): string | null {
  const alvo = cultura.semeadura_fase_lunar;
  if (!alvo || alvo === "qualquer") return null;

  const hoje = faseSimplificada(faseHoje);
  if (hoje === alvo) {
    return `Hoje é boa altura para semear ${cultura.nome.toLowerCase()} — fase ideal (${alvo}).`;
  }
  return `Hoje não é a fase lunar ideal para semear ${cultura.nome.toLowerCase()} (recomendado: ${alvo}).`;
}
