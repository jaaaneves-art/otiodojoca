"use client";

import { useEffect, useRef, useState } from "react";

// Leaflet carregado via CDN (sem dependência nova no package.json — mesma
// abordagem do projeto de referência AutoNex, ver
// docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md). window.L só
// existe depois do script carregar; por isso o mapa só é construído dentro
// do useEffect, nunca durante o render do servidor.
declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS_ID = "leaflet-cdn-css";
const LEAFLET_JS_ID = "leaflet-cdn-js";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Portugal continental, centro aproximado — usado como vista inicial antes
// de haver pontos, ou quando nenhum anúncio filtrado tem localização
// reconhecida.
const CENTRO_PORTUGAL: [number, number] = [39.6, -8.0];
const ZOOM_INICIAL = 7;

function carregarLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve) => {
    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const link = document.createElement("link");
      link.id = LEAFLET_CSS_ID;
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }

    const existing = document.getElementById(LEAFLET_JS_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.L) {
        resolve(window.L);
      } else {
        existing.addEventListener("load", () => resolve(window.L));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_JS_ID;
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    document.body.appendChild(script);
  });
}

export interface PontoMapa {
  id: number;
  lat: number;
  lon: number;
  titulo: string;
  precoLabel: string;
  href: string;
}

export function ViaturasMapa({ pontos }: { pontos: PontoMapa[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [pronto, setPronto] = useState(false);

  // Cria o mapa uma única vez.
  useEffect(() => {
    let cancelado = false;
    carregarLeaflet().then((L) => {
      if (cancelado || !L || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current).setView(CENTRO_PORTUGAL, ZOOM_INICIAL);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setPronto(true);
    });

    return () => {
      cancelado = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza os marcadores sempre que a lista de pontos muda (nova pesquisa/filtro).
  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : undefined;
    const map = mapRef.current;
    if (!pronto || !L || !map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    pontos.forEach((ponto) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#0369a1;color:#fff;font-weight:600;font-size:12px;padding:4px 8px;border-radius:999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);white-space:nowrap;">${ponto.precoLabel}</div>`,
        iconAnchor: [20, 12],
      });
      const marker = L.marker([ponto.lat, ponto.lon], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:160px"><a href="${ponto.href}" style="font-weight:600;color:#0369a1;text-decoration:none;">${escapeHtml(ponto.titulo)}</a><br/><span style="font-size:13px;">${escapeHtml(ponto.precoLabel)}</span></div>`
      );
      markersRef.current.push(marker);
    });

    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos.map((p) => [p.lat, p.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else {
      map.setView(CENTRO_PORTUGAL, ZOOM_INICIAL);
    }
  }, [pontos, pronto]);

  return (
    <div>
      <div ref={containerRef} className="w-full h-[500px] rounded-lg border border-viaturas-200" />
      {pontos.length === 0 && (
        <p className="text-sm text-viaturas-600 mt-2">
          Nenhum dos anúncios apresentados tem uma localização reconhecida no mapa — continuam todos visíveis na lista.
        </p>
      )}
    </div>
  );
}

// O texto vem de dados do utilizador (título do anúncio) — escapado antes de
// ir para dentro de innerHTML do popup do Leaflet.
function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
