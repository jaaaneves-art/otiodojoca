"use client";

import { useEffect, useState } from "react";

export interface AuctionCountdownState {
  /** null enquanto o relógio do browser ainda não arrancou (primeira
   * renderização, antes do useEffect) — nunca acontece no servidor. */
  restanteMs: number | null;
  acabouLocalmente: boolean;
}

// Relógio a bater a cada segundo enquanto o leilão está "live" — dá o
// "tempo que falta" ao vivo em qualquer sítio onde um leilão apareça
// (painel de licitar, cartão da listagem principal, página
// /gran-bazar/leiloes). Partilhado para não repetir a mesma lógica em
// três sítios diferentes.
export function useAuctionCountdown(endsAt: string, status: string): AuctionCountdownState {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "live") {
      setAgora(null);
      return;
    }
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, endsAt]);

  const restanteMs = status === "live" && agora !== null ? Math.max(0, new Date(endsAt).getTime() - agora) : null;
  const acabouLocalmente = restanteMs !== null && restanteMs <= 0;

  return { restanteMs, acabouLocalmente };
}

// Formata os milissegundos restantes como "2d 4h", "3h 12m", "8m 40s" ou,
// já perto do fim, só "12s".
export function formatarContagem(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m ${segundos}s`;
  return `${segundos}s`;
}

// Esquema de cores pedido: a mais de 1h do fim fica verde (calmo), a menos
// de 1h fica amarelo, a menos de 5 minutos fica vermelho.
export function corContagem(ms: number): { badge: string; texto: string } {
  const minutos = ms / 60000;
  if (minutos > 60) return { badge: "bg-green-100 border-green-300", texto: "text-green-800" };
  if (minutos > 5) return { badge: "bg-yellow-100 border-yellow-300", texto: "text-yellow-800" };
  return { badge: "bg-red-100 border-red-300", texto: "text-red-700" };
}

// No último minuto pisca — cada vez mais depressa (o ciclo encolhe de 1s
// para 0.15s) e mais intensamente (o mergulho de opacidade aprofunda-se) à
// medida que os segundos se esgotam. A keyframe "otj-leilao-piscar" está
// em app/globals.css; aqui só se calculam a duração e a variável CSS
// --piscar-min que ela lê.
export function estilosPiscar(restanteMs: number | null): React.CSSProperties | undefined {
  if (restanteMs === null || restanteMs <= 0 || restanteMs > 60000) return undefined;
  const fracao = Math.min(1, Math.max(0, restanteMs / 60000));
  const duracaoSeg = 0.15 + fracao * 0.85;
  const intensidade = 0.55 - (1 - fracao) * 0.4;
  return {
    animation: `otj-leilao-piscar ${duracaoSeg}s ease-in-out infinite`,
    ["--piscar-min" as any]: intensidade,
  } as React.CSSProperties;
}
