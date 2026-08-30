"use client";

import { useState } from "react";
import { ViaturaAdCard } from "@/components/viaturas/viatura-ad-card";
import { ViaturasMapa, type PontoMapa } from "@/components/viaturas/viaturas-mapa";

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
      <div className="flex justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={() => setVista("lista")}
          className={`text-sm font-medium py-1.5 px-3 rounded-lg border transition ${
            vista === "lista"
              ? "bg-viaturas-600 border-viaturas-600 text-white"
              : "border-viaturas-200 text-viaturas-700 hover:bg-viaturas-50"
          }`}
        >
          📋 Lista
        </button>
        <button
          type="button"
          onClick={() => setVista("mapa")}
          className={`text-sm font-medium py-1.5 px-3 rounded-lg border transition ${
            vista === "mapa"
              ? "bg-viaturas-600 border-viaturas-600 text-white"
              : "border-viaturas-200 text-viaturas-700 hover:bg-viaturas-50"
          }`}
        >
          🗺️ Mapa{pontos.length > 0 && ` (${pontos.length})`}
        </button>
      </div>

      {vista === "lista" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
