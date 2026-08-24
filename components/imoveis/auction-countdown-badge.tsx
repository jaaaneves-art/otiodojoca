"use client";

// Reutiliza o hook do Gran Bazar tal e qual — é lógica pura de tempo, sem
// nada específico de paleta ou de módulo, por isso não faz sentido copiar
// os mesmos 74 lines para lib/imoveis/. Só o componente visual (que usa
// classes Tailwind literais bg-imoveis-*, por isso não pode ser partilhado
// — ver docs/IMOVEIS.md) é que tem uma versão própria aqui.
import { useAuctionCountdown, formatarContagem, corContagem, estilosPiscar } from "@/lib/gran-bazar/auction-countdown";

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
      <span className={`text-xs text-imoveis-600 ${className}`}>
        {startsAt ? `Começa em ${formatarData(startsAt)}` : "Agendado"}
      </span>
    );
  }

  if (status === "cancelled") {
    return <span className={`text-xs text-imoveis-600 ${className}`}>Cancelado</span>;
  }

  if (status === "ended" || acabouLocalmente) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border bg-imoveis-100 border-imoveis-200 text-imoveis-700 ${className}`}
      >
        {acabouLocalmente && status === "live" ? "A fechar..." : "Terminado"}
      </span>
    );
  }

  if (restanteMs === null) {
    return <span className={`text-xs text-imoveis-600 ${className}`}>Termina {formatarData(endsAt)}</span>;
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
