import Link from "next/link";
import FavoriteButton from "@/components/viaturas/favorite-button";
import AuctionCountdownBadge from "@/components/viaturas/auction-countdown-badge";
import { VIATURAS_AD_TYPES } from "@/lib/viaturas/ad-types";

interface ViaturaAd {
  id: number;
  type: string;
  title: string;
  price: number | null;
  price_type: string | null;
  location: string | null;
  status: string;
  details?: {
    marca?: string;
    modelo?: string;
    ano?: string | number;
    quilometros?: string | number;
    combustivel?: string;
    caixa?: string;
    condicao?: string;
    tipo_vendedor?: string;
  } | null;
  created_at: string;
  auction?: { current_price: number; ends_at: string; starts_at: string; status: string } | null;
}

const TYPE_BADGE_STYLE: Record<string, string> = {
  venda: "bg-viaturas-600 text-white",
  leilao: "bg-amber-800 text-white",
  comprar: "bg-purple-600 text-white",
  ceder: "bg-green-600 text-white",
  alugar: "bg-viaturas-800 text-white",
};

const formatKm = (km: string | number | undefined) =>
  km == null || km === "" ? null : `${Number(km).toLocaleString("pt-PT")} km`;

export function ViaturaAdCard({
  ad,
  isFavorite,
  isLoggedIn,
  photo,
}: {
  ad: ViaturaAd;
  isFavorite: boolean;
  isLoggedIn: boolean;
  photo?: string;
}) {
  const typeInfo = VIATURAS_AD_TYPES[ad.type];
  const badgeClass = TYPE_BADGE_STYLE[ad.type] || "bg-viaturas-600 text-white";
  const d = ad.details ?? {};
  const subtitulo = [d.ano, formatKm(d.quilometros), d.combustivel, d.caixa].filter(Boolean).join(" · ");

  return (
    <div className="relative">
      <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/viaturas/${ad.id}`}>
        <div className="bg-white rounded-xl border border-viaturas-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
          {photo ? (
            <div className="w-full h-40 bg-viaturas-50">
              <img src={photo} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-viaturas-50 flex items-center justify-center text-4xl">🚗</div>
          )}

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${badgeClass}`}>
                  {typeInfo?.icon ?? "🔨"} {typeInfo?.label ?? "Leilão"}
                </span>
                {d.condicao === "Novo" && (
                  <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-green-600 text-white">NOVO</span>
                )}
                {d.tipo_vendedor === "Stand" && (
                  <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-slate-700 text-white">STAND</span>
                )}
              </div>
              <h3 className="font-semibold text-viaturas-900 line-clamp-2">
                {d.marca && d.modelo ? `${d.marca} ${d.modelo}` : ad.title}
              </h3>
              {subtitulo && <p className="text-sm text-viaturas-600 mb-2">{subtitulo}</p>}
            </div>

            <div>
              {ad.type === "venda" && (
                <p className="text-lg font-bold text-viaturas-700 mb-1">
                  {ad.price == null ? "Consultar" : `${ad.price.toFixed(2)} €`}
                  {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
                </p>
              )}
              {ad.type === "comprar" && (
                <p className="text-lg font-bold text-purple-700 mb-1">
                  {ad.price == null ? "Orçamento a combinar" : `Até ${ad.price.toFixed(2)} €`}
                </p>
              )}
              {ad.type === "ceder" && (
                <p className="text-lg font-bold text-green-700 mb-1">Grátis</p>
              )}
              {ad.type === "alugar" && (
                <p className="text-lg font-bold text-viaturas-700 mb-1">
                  {ad.price == null ? "Consultar" : `${ad.price.toFixed(2)} €/dia`}
                </p>
              )}
              {ad.type === "leilao" && ad.auction && (
                <div className="mb-1">
                  <p className="text-lg font-bold text-amber-800">Lance atual: {ad.auction.current_price.toFixed(2)} €</p>
                  <AuctionCountdownBadge
                    status={ad.auction.status}
                    endsAt={ad.auction.ends_at}
                    startsAt={ad.auction.starts_at}
                    formatoData="curta"
                  />
                </div>
              )}
              {ad.location && <p className="text-xs text-viaturas-500">📍 {ad.location}</p>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
