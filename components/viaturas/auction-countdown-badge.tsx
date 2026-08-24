"use client";

import { useAuctionCountdown, formatarContagem, corContagem, estilosPiscar } from "@/lib/gran-bazar/auction-countdown";

// Reutiliza tal e qual a lógica do relógio de contagem do Gran Bazar
// (lib/gran-bazar/auction-countdown.ts) — é genuinamente genérica, sem
// nenhuma classe "bazar-*" lá dentro. Só este componente visual tem cópia
// própria, porque o original (components/gran-bazar/auction-countdown-
// badge.tsx) tem as cores "bazar-*" embutidas — aqui usam-se as cores
// "viaturas-*" para ficar consistente com a identidade visual do módulo.

const formatDataHoraLonga = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
const formatDataHoraCurta = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });

interface AuctionCountdownBadgeProps {
  status: string;
  endsAt: string;
  startsAt?: string;
  /** "curta" (ex: "23/08, 14:30") para espaços apertados como cartões; "longa" por omissão. */
  formatoData?: "longa" | "curta";
  className?: string;
}

export default function AuctionCountdownBadge({
  status,
  endsAt,
  startsAt,
  formatoData = "longa",
  className = "",
}: AuctionCountdownBadgeProps) {
  const { restanteMs, acabouLocalmente } = useAuctionCountdown(endsAt, status);
  const formatarData = formatoData === "curta" ? formatDataHoraCurta : formatDataHoraLonga;

  if (status === "scheduled") {
    return (
      <span className={`text-xs text-viaturas-600 ${className}`}>
        {startsAt ? `Começa em ${formatarData(startsAt)}` : "Agendado"}
      </span>
    );
  }

  if (status === "cancelled") {
    return <span className={`text-xs text-viaturas-600 ${className}`}>Cancelado</span>;
  }

  if (status === "ended" || acabouLocalmente) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border bg-viaturas-100 border-viaturas-200 text-viaturas-700 ${className}`}
      >
        {acabouLocalmente && status === "live" ? "A fechar..." : "Terminado"}
      </span>
    );
  }

  // status === "live", mas o relógio do browser ainda não arrancou (esta é
  // a primeiríssima renderização, igual no servidor e no cliente).
  if (restanteMs === null) {
    return <span className={`text-xs text-viaturas-600 ${className}`}>Termina {formatarData(endsAt)}</span>;
  }

  const cor = corContagem(restanteMs);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${cor.badge} ${cor.texto} ${className}`}
      style={estilosPiscar(restanteMs)}
    >
      ⏳ {formatarContagem(restanteMs)}
    </span>
  );
}
