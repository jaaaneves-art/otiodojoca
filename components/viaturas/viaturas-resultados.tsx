"use client";

import { useState } from "react";
import { ViaturaAdCard } from "@/components/viaturas/viatura-ad-card";
import { ViaturasMapa, type PontoMapa } from "@/components/viaturas/viaturas-mapa";
import { LayoutGrid, Map } from "lucide-react";

interface ResultadoAd {
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
  /** Coordenadas resolvidas a partir de `location` (ver app/viaturas/page.tsx) — null quando não há correspondência em `municipios`. */
  lat?: number | null;
  lon?: number | null;
}

function precoLabel(ad: ResultadoAd): string {
  switch (ad.type) {
    case "venda":
      return ad.price == null ? "Consultar" : `${ad.price.toFixed(0)} €`;
    case "comprar":
      return ad.price == null ? "Orçamento a combinar" : `Até ${ad.price.toFixed(0)} €`;
    case "ceder":
      return "Grátis";
    case "alugar":
      return ad.price == null ? "Consultar" : `${ad.price.toFixed(0)} €/dia`;
    case "leilao":
      return ad.auction ? `${ad.auction.current_price.toFixed(0)} €` : "Leilão";
    default:
      return "";
  }
}

export function ViaturasResultados({
  ads,
  favoriteIds,
  isLoggedIn,
  photosMap,
}: {
  ads: ResultadoAd[];
  favoriteIds: number[];
  isLoggedIn: boolean;
  photosMap: Record<number, string>;
}) {
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const favoritos = new Set(favoriteIds);

  const pontos: PontoMapa[] = ads
    .filter((ad): ad is ResultadoAd & { lat: number; lon: number } => ad.lat != null && ad.lon != null)
    .map((ad) => ({
      id: ad.id,
      lat: ad.lat,
      lon: ad.lon,
      titulo: ad.details?.marca && ad.details?.modelo ? `${ad.details.marca} ${ad.details.modelo}` : ad.title,
      precoLabel: precoLabel(ad),
      href: `/viaturas/${ad.id}`,
    }));

  return (
    <div>
      <div className="mb-5 flex justify-end gap-1 rounded-xl bg-slate-200/70 p-1 sm:ml-auto sm:w-fit">
        <button
          type="button"
          onClick={() => setVista("lista")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition sm:flex-none ${
            vista === "lista"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          <LayoutGrid size={16} aria-hidden="true" /> Grelha
        </button>
        <button
          type="button"
          onClick={() => setVista("mapa")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition sm:flex-none ${
            vista === "mapa"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          <Map size={16} aria-hidden="true" /> Mapa{pontos.length > 0 && ` (${pontos.length})`}
        </button>
      </div>

      {vista === "lista" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <ViaturaAdCard
              key={ad.id}
              ad={ad}
              isFavorite={favoritos.has(ad.id)}
              isLoggedIn={isLoggedIn}
              photo={photosMap[ad.id]}
            />
          ))}
        </div>
      ) : (
        <ViaturasMapa pontos={pontos} />
      )}
    </div>
  );
}
