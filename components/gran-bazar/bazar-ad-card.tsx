import Link from "next/link";
import FavoriteButton from "@/components/gran-bazar/favorite-button";
import AuctionCountdownBadge from "@/components/gran-bazar/auction-countdown-badge";
import { BAZAR_AD_TYPES } from "@/lib/gran-bazar/ad-types";

interface BazarAd {
  id: number;
  type: string;
  title: string;
  price: number | null;
  price_type: string | null;
  location: string | null;
  status: string;
  details?: { seeking?: string } | null;
  created_at: string;
  auction?: { current_price: number; ends_at: string; starts_at: string; status: string } | null;
}

const TYPE_BADGE_STYLE: Record<string, string> = {
  venda: "bg-bazar-500 text-white",
  troca: "bg-blue-600 text-white",
  oferta: "bg-green-600 text-white",
  procura: "bg-purple-600 text-white",
  leilao: "bg-amber-800 text-white",
};

export function BazarAdCard({
  ad,
  isFavorite,
  isLoggedIn,
  photo,
}: {
  ad: BazarAd;
  isFavorite: boolean;
  isLoggedIn: boolean;
  photo?: string;
}) {
  const typeInfo = BAZAR_AD_TYPES[ad.type];
  const badgeClass = TYPE_BADGE_STYLE[ad.type] || "bg-bazar-500 text-white";

  return (
    <div className="relative">
      <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/gran-bazar/${ad.id}`}>
        <div className="bg-white rounded-xl border border-bazar-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
          {photo ? (
            <div className="w-full h-40 bg-bazar-50">
              <img src={photo} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-bazar-50 flex items-center justify-center text-4xl">📦</div>
          )}

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full mb-2 ${badgeClass}`}>
                {typeInfo?.icon ?? "🔨"} {typeInfo?.label ?? "Leilão"}
              </span>
              <h3 className="font-semibold text-bazar-900 line-clamp-2 mb-2">{ad.title}</h3>

              {ad.type === "troca" && (
                <p className="text-sm text-bazar-700 line-clamp-2 mb-2">
                  Aceito troca por: {ad.details?.seeking || "a combinar"}
                </p>
              )}
            </div>

            <div>
              {ad.type === "venda" && (
                <p className="text-lg font-bold text-bazar-700 mb-1">
                  {ad.price_type === "free" || ad.price == null ? "Grátis" : `${ad.price?.toFixed(2)} €`}
                  {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
                </p>
              )}
              {ad.type === "oferta" && (
                <p className="text-lg font-bold text-green-700 mb-1">GRÁTIS</p>
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
              {ad.location && <p className="text-xs text-bazar-500">📍 {ad.location}</p>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
