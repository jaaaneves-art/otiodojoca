import Link from "next/link";
import LupFavoriteButton from "@/components/lup/favorite-button";
import { LUP_AD_TYPES, estimarCo2Evitado } from "@/lib/lup/ad-types";
import { Clock3, Leaf, MapPin, Package2, PawPrint, Recycle, Salad, Sparkles } from "lucide-react";

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

const CATEGORIA_ICON: Record<string, typeof Leaf> = {
  "lup-humano": Salad,
  "lup-animal": PawPrint,
  "lup-compostagem": Leaf,
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
  const CategoryIcon = CATEGORIA_ICON[ad.category?.slug ?? ""] ?? Recycle;

  return (
    <article className="group relative h-full">
      <LupFavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/lup/${ad.id}`}>
        <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.4rem] border border-lup-200/90 bg-white shadow-[0_12px_35px_rgba(15,74,44,0.05)] transition duration-300 group-hover:-translate-y-1 group-hover:border-lup-300 group-hover:shadow-[0_20px_45px_rgba(15,74,44,0.12)]">
          {photo ? (
            <div className="relative h-48 w-full overflow-hidden bg-lup-50">
              <img src={photo} alt={ad.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          ) : (
            <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_right,#dcfce8,#f7fff9_65%)] text-lup-700">
              <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border-[16px] border-lup-200/70" />
              <CategoryIcon className="h-12 w-12" strokeWidth={1.6} />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${badgeClass}`}>
                  {typeInfo?.icon ?? "♻️"} {typeInfo?.label ?? ad.type}
                </span>
                {ad.category && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-lup-200 bg-lup-50 px-2.5 py-1 text-[11px] font-bold text-lup-800">
                    <CategoryIcon className="h-3 w-3" /> {ad.category.name}
                  </span>
                )}
              </div>
              <h2 className="mb-3 line-clamp-2 text-lg font-extrabold leading-snug tracking-[-0.02em] text-lup-950">{ad.title}</h2>

              {ad.details?.quantity && (
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-lup-800">
                  <Package2 className="h-4 w-4 text-lup-600" /> {ad.details.quantity} {ad.details.unit ?? ""}
                </p>
              )}
            </div>

            <div>
              {ad.type === "venda" && (
                <p className="mb-2 text-xl font-black tracking-tight text-lup-800">
                  {ad.price == null ? "Grátis" : `${ad.price.toFixed(2)} €`}
                </p>
              )}
              {ad.type === "oferta" && (
                <p className="mb-2 text-lg font-black tracking-wide text-lup-700">GRÁTIS</p>
              )}
              {co2 != null && (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-lup-600"><Sparkles className="h-3.5 w-3.5" /> ~{co2} kg CO₂ evitado</p>
              )}
              {prazo && <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700"><Clock3 className="h-3.5 w-3.5" /> Recolher até {prazo}</p>}
              {ad.location && <p className="flex items-center gap-1.5 text-xs font-medium text-lup-600"><MapPin className="h-3.5 w-3.5" /> {ad.location}</p>}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
