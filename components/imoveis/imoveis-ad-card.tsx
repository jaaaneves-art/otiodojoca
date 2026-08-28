import Link from "next/link";
import FavoriteButton from "@/components/imoveis/favorite-button";
import AuctionCountdownBadge from "@/components/imoveis/auction-countdown-badge";
import { IMOVEL_AD_TYPES, propertyConditionLabel } from "@/lib/imoveis/ad-types";

interface ImovelAd {
  id: number;
  type: string;
  title: string;
  price: number | null;
  price_type: string | null;
  location: string | null;
  status: string;
  details?: {
    area?: number; bedrooms?: number; bathrooms?: number; condition?: string;
    para_estudantes?: boolean | string;
    tipo_quarto?: string; casa_banho?: string;
  } | null;
  created_at: string;
  auction?: { current_price: number; ends_at: string; starts_at: string; status: string } | null;
}

const TYPE_BADGE_STYLE: Record<string, string> = {
  venda: "bg-imoveis-600 text-white",
  leilao: "bg-amber-800 text-white",
  arrendamento: "bg-teal-700 text-white",
  quarto: "bg-sky-700 text-white",
  permuta: "bg-purple-700 text-white",
  companhia: "bg-rose-700 text-white",
};

export function ImovelAdCard({
  ad,
  isFavorite,
  isLoggedIn,
  photo,
  categoryName,
}: {
  ad: ImovelAd;
  isFavorite: boolean;
  isLoggedIn: boolean;
  photo?: string;
  categoryName?: string;
}) {
  const typeInfo = IMOVEL_AD_TYPES[ad.type];
  const badgeClass = TYPE_BADGE_STYLE[ad.type] || "bg-imoveis-600 text-white";
  const area = ad.details?.area;
  const bedrooms = ad.details?.bedrooms;
  const bathrooms = ad.details?.bathrooms;

  return (
    <div className="relative">
      <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/imoveis/${ad.id}`}>
        <div className="bg-white rounded-xl border border-imoveis-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
          {photo ? (
            <div className="w-full h-40 bg-imoveis-50">
              <img src={photo} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-imoveis-50 flex items-center justify-center text-4xl">🏠</div>
          )}

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full mb-2 ${badgeClass}`}>
                {typeInfo?.icon ?? "🔨"} {typeInfo?.label ?? "Leilão"}
              </span>
              {categoryName && (
                <span className="inline-block text-xs font-medium text-imoveis-600 ml-1 mb-2">{categoryName}</span>
              )}
              <h3 className="font-semibold text-imoveis-900 line-clamp-2 mb-2">{ad.title}</h3>

              <div className="flex flex-wrap gap-3 text-xs text-imoveis-600 mb-2">
                {area != null && <span>📐 {area} m²</span>}
                {bedrooms != null && <span>🛏️ {bedrooms}</span>}
                {bathrooms != null && <span>🚿 {bathrooms}</span>}
                {ad.details?.tipo_quarto && (
                  <span>{ad.details.tipo_quarto === "privado" ? "🔒 Quarto privado" : "🤝 Quarto partilhado"}</span>
                )}
                {ad.details?.casa_banho && (
                  <span>🚿 Casa de banho {ad.details.casa_banho === "privada" ? "privada" : "partilhada"}</span>
                )}
              </div>
            </div>

            <div>
              {ad.type === "venda" && (
                <p className="text-lg font-bold text-imoveis-700 mb-1">
                  {ad.price == null ? "Sob consulta" : `${ad.price.toLocaleString("pt-PT")} €`}
                  {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
                </p>
              )}
              {(ad.type === "arrendamento" || ad.type === "quarto") && (
                <p className="text-lg font-bold text-imoveis-700 mb-1">
                  {ad.price == null ? "Sob consulta" : `${ad.price.toLocaleString("pt-PT")} €/mês`}
                  {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
                </p>
              )}
              {ad.type === "leilao" && ad.auction && (
                <div className="mb-1">
                  <p className="text-lg font-bold text-amber-800">Lance atual: {ad.auction.current_price.toLocaleString("pt-PT")} €</p>
                  <AuctionCountdownBadge
                    status={ad.auction.status}
                    endsAt={ad.auction.ends_at}
                    startsAt={ad.auction.starts_at}
                    formatoData="curta"
                  />
                </div>
              )}
              {ad.type === "permuta" && (
                <p className="text-sm font-semibold text-purple-700 mb-1">🔄 Procura em troca</p>
              )}
              {ad.type === "companhia" && (
                <p className="text-sm font-semibold text-rose-700 mb-1">🤝 Troca por companhia</p>
              )}
              {!!ad.details?.para_estudantes && (
                <span className="inline-block text-xs font-medium text-imoveis-700 bg-imoveis-100 rounded-full px-2 py-0.5 mb-1">
                  🎓 Para estudantes
                </span>
              )}
              {ad.location && <p className="text-xs text-imoveis-500">📍 {ad.location}</p>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
