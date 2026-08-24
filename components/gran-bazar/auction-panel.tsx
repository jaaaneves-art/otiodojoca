"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { placeBid } from "@/app/gran-bazar/leiloes/actions";
import { useAuctionCountdown } from "@/lib/gran-bazar/auction-countdown";
import AuctionCountdownBadge from "@/components/gran-bazar/auction-countdown-badge";

interface Bid {
  id: number;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder_username?: string | null;
}

interface AuctionPanelProps {
  auction: {
    id: number;
    ad_id: number;
    current_price: number;
    minimum_increment: number;
    starts_at: string;
    ends_at: string;
    status: string;
    winner_id: string | null;
  };
  sellerId: string;
  currentUserId?: string;
  bids: Bid[];
}

const formatEuros = (v: number) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDataHora = (iso: string) => new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });

export default function AuctionPanel({ auction, sellerId, currentUserId, bids }: AuctionPanelProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(() => (auction.current_price + auction.minimum_increment).toFixed(2));
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Relógio a bater a cada segundo, só enquanto o leilão está em curso —
  // partilhado com o badge visual (AuctionCountdownBadge) para que os dois
  // fiquem sempre de acordo; aqui só se usa para decidir se o formulário de
  // licitar deve continuar visível.
  const { restanteMs, acabouLocalmente } = useAuctionCountdown(auction.ends_at, auction.status);

  const jaTerminou = auction.status === "ended" || (auction.status === "live" && new Date(auction.ends_at) <= new Date());
  const aDecorrer = auction.status === "live" && !jaTerminou;
  const ehVendedor = !!currentUserId && currentUserId === sellerId;
  const minimoValido = auction.current_price + auction.minimum_increment;

  const podeLicitar = aDecorrer && !acabouLocalmente;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);

    const valor = parseFloat(amount);
    if (isNaN(valor) || valor < minimoValido) {
      setErro(`O lance mínimo é ${formatEuros(minimoValido)} €`);
      return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append("auctionId", auction.id.toString());
    formData.append("adId", auction.ad_id.toString());
    formData.append("amount", valor.toString());
    formData.append(
      "requestId",
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    );

    try {
      await placeBid(formData);
      router.refresh();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível registar o lance");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-amber-800 text-white">🔨 Leilão</span>
        <AuctionCountdownBadge status={auction.status} endsAt={auction.ends_at} startsAt={auction.starts_at} />
      </div>

      <p className="text-3xl font-bold text-amber-900 mb-1">{formatEuros(auction.current_price)} €</p>
      <p className="text-sm text-bazar-600 mb-4">
        {jaTerminou
          ? auction.winner_id
            ? auction.winner_id === currentUserId
              ? "Parabéns — ganhaste este leilão!"
              : "Este leilão já terminou."
            : "Este leilão terminou sem lances."
          : `Lance atual · incremento mínimo ${formatEuros(auction.minimum_increment)} €`}
      </p>

      {podeLicitar && !ehVendedor && currentUserId && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-2">
          <div className="flex-1">
            <input
              type="number"
              step="0.01"
              min={minimoValido}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-amber-300 rounded-lg p-2 focus:outline-none focus:border-amber-600"
            />
            <p className="text-xs text-bazar-600 mt-1">Mínimo: {formatEuros(minimoValido)} €</p>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-amber-800 text-white font-medium py-2 px-6 rounded-lg hover:bg-amber-900 disabled:opacity-50 h-fit"
          >
            {sending ? "A licitar..." : "Licitar"}
          </button>
        </form>
      )}

      {aDecorrer && acabouLocalmente && (
        <p className="text-sm text-bazar-600 bg-white border border-amber-200 rounded-lg p-3">
          O leilão está a fechar — aguarda um instante e atualiza a página.
        </p>
      )}

      {podeLicitar && ehVendedor && (
        <p className="text-sm text-bazar-600 bg-white border border-amber-200 rounded-lg p-3">
          Este é o teu anúncio — não podes licitar no teu próprio leilão.
        </p>
      )}

      {podeLicitar && !currentUserId && (
        <a href="/login">
          <button className="w-full bg-amber-800 text-white font-medium py-2 px-6 rounded-lg hover:bg-amber-900">
            Entrar para licitar
          </button>
        </a>
      )}

      {erro && <p className="text-sm text-red-600 mb-2">{erro}</p>}

      {bids.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-bazar-700 cursor-pointer hover:text-bazar-900">
            Histórico de lances ({bids.length})
          </summary>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {bids.map((bid) => (
              <li key={bid.id} className="text-sm text-bazar-800 flex justify-between border-b border-amber-100 py-1">
                <span>{bid.bidder_username ?? "Licitador"}</span>
                <span className="font-semibold">{formatEuros(bid.amount)} €</span>
                <span className="text-xs text-bazar-500">{formatDataHora(bid.created_at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
