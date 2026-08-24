import Link from "next/link";
import LupFavoriteButton from "@/components/lup/favorite-button";
import { LUP_AD_TYPES, estimarCo2Evitado } from "@/lib/lup/ad-types";

interface LupAd {
  id: number;
  type: string;
  title: string;
  price: number | null;
  price_type: string | null;
  location: string | null;
  status: string;
  details?: {
    quantity?: string;
    unit?: string;
    kg_estimate?: string;
    pickup_ends_at?: string;
  } | null;
  created_at: string;
  category?: { name: string; slug: string } | null;
}

const CATEGORIA_ICON: Record<string, string> = {
  "lup-humano": "🥗",
  "lup-animal": "🐾",
  "lup-compostagem": "🌱",
};

const TYPE_BADGE_STYLE: Record<string, string> = {
  oferta: "bg-lup-600 text-white",
  venda: "bg-emerald-700 text-white",
  procura: "bg-purple-600 text-white",
};

function formatarPrazo(iso?: string) {
  if (!iso) return null;
  const data = new Date(iso);
  if (isNaN(data.getTime())) return null;
  return data.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

export function LupAdCard({
  ad,
  isFavorite,
  isLoggedIn,
  photo,
}: {
  ad: LupAd;
  isFavorite: boolean;
  isLoggedIn: boolean;
  photo?: string;
}) {
  const typeInfo = LUP_AD_TYPES[ad.type];
  const badgeClass = TYPE_BADGE_STYLE[ad.type] || "bg-lup-600 text-white";
  const prazo = formatarPrazo(ad.details?.pickup_ends_at);
  const co2 = estimarCo2Evitado(ad.details?.kg_estimate ? parseFloat(ad.details.kg_estimate) : null);

  return (
    <div className="relative">
      <LupFavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/lup/${ad.id}`}>
        <div className="bg-white rounded-xl border border-lup-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
          {photo ? (
            <div className="w-full h-40 bg-lup-50">
              <img src={photo} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-lup-50 flex items-center justify-center text-4xl">
              {CATEGORIA_ICON[ad.category?.slug ?? ""] ?? "♻️"}
            </div>
          )}

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${badgeClass}`}>
                  {typeInfo?.icon ?? "♻️"} {typeInfo?.label ?? ad.type}
                </span>
                {ad.category && (
                  <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-lup-50 text-lup-700 border border-lup-200">
                    {CATEGORIA_ICON[ad.category.slug] ?? "📦"} {ad.category.name}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lup-900 line-clamp-2 mb-2">{ad.title}</h3>

              {ad.details?.quantity && (
                <p className="text-sm text-lup-700 mb-1">
                  📦 {ad.details.quantity} {ad.details.unit ?? ""}
                </p>
              )}
            </div>

            <div>
              {ad.type === "venda" && (
                <p className="text-lg font-bold text-lup-700 mb-1">
                  {ad.price == null ? "Grátis" : `${ad.price.toFixed(2)} €`}
                </p>
              )}
              {ad.type === "oferta" && (
                <p className="text-lg font-bold text-lup-700 mb-1">GRÁTIS</p>
              )}
              {co2 != null && (
                <p className="text-xs text-lup-600 mb-1">🌍 ~{co2} kg CO₂ evitado (estimativa)</p>
              )}
              {prazo && <p className="text-xs text-amber-700 mb-1">⏰ Recolher até {prazo}</p>}
              {ad.location && <p className="text-xs text-lup-500">📍 {ad.location}</p>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
