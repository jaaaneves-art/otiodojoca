import Link from "next/link";
import FavoriteButton from "@/components/viaturas/favorite-button";
import AuctionCountdownBadge from "@/components/viaturas/auction-countdown-badge";
import { VIATURAS_AD_TYPES } from "@/lib/viaturas/ad-types";
import { CalendarDays, CarFront, Fuel, Gauge, MapPin, ShieldCheck } from "lucide-react";

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

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

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
  const specs = [
    d.ano ? { icon: CalendarDays, label: String(d.ano) } : null,
    formatKm(d.quilometros) ? { icon: Gauge, label: formatKm(d.quilometros)! } : null,
    d.combustivel ? { icon: Fuel, label: d.combustivel } : null,
  ].filter(Boolean) as Array<{ icon: typeof CalendarDays; label: string }>;

  const price = ad.type === "ceder"
    ? "Grátis"
    : ad.type === "comprar"
      ? ad.price == null ? "A combinar" : `Até ${formatPrice(ad.price)}`
      : ad.type === "alugar"
        ? ad.price == null ? "Consultar" : `${formatPrice(ad.price)}/dia`
        : ad.type === "leilao"
          ? ad.auction ? formatPrice(ad.auction.current_price) : "Leilão"
          : ad.price == null ? "Consultar" : formatPrice(ad.price);

  return (
    <article className="group relative h-full">
      <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={isLoggedIn} variant="card" />
      <Link href={`/viaturas/${ad.id}`} className="block h-full rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
        <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-xl group-hover:shadow-slate-900/10">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {photo ? (
              <img src={photo} alt={ad.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
          ) : (
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 text-blue-700">
                <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[18px] border-white/60" />
                <CarFront size={52} strokeWidth={1.5} aria-hidden="true" />
              </div>
          )}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/50 to-transparent p-3 pb-10">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] shadow-sm ${badgeClass}`}>
                {typeInfo?.label ?? "Leilão"}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div>
              <div className="mb-2 flex min-h-6 flex-wrap gap-1.5">
                {d.condicao === "Novo" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">Novo</span>
                )}
                {d.tipo_vendedor === "Stand" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700"><ShieldCheck size={12} /> Stand</span>
                )}
              </div>
              <h3 className="line-clamp-2 text-lg font-black leading-tight tracking-[-0.02em] text-slate-950">
                {d.marca && d.modelo ? `${d.marca} ${d.modelo}` : ad.title}
              </h3>
              {d.marca && d.modelo && ad.title !== `${d.marca} ${d.modelo}` && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{ad.title}</p>}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
              {specs.slice(0, 3).map(({ icon: Icon, label }) => <span key={label} className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-slate-600"><Icon size={15} className="text-blue-600" aria-hidden="true" /><span className="truncate">{label}</span></span>)}
              {specs.length === 0 && <span className="col-span-3 text-xs text-slate-400">Características no anúncio</span>}
            </div>

            <div className="mt-auto pt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  {ad.type === "leilao" && <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Lance atual</p>}
                  <p className={`text-xl font-black tracking-[-0.03em] ${ad.type === "leilao" ? "text-amber-800" : "text-slate-950"}`}>{price}</p>
                  {ad.price_type === "negotiable" && ad.price != null && <p className="text-[11px] font-semibold text-slate-500">Preço negociável</p>}
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">Ver viatura</span>
              </div>
              {ad.type === "leilao" && ad.auction && (
                <div className="mt-3">
                  <AuctionCountdownBadge
                    status={ad.auction.status}
                    endsAt={ad.auction.ends_at}
                    startsAt={ad.auction.starts_at}
                    formatoData="curta"
                  />
                </div>
              )}
              {ad.location && <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500"><MapPin size={14} className="text-slate-400" aria-hidden="true" /> <span className="truncate">{ad.location}</span></p>}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
