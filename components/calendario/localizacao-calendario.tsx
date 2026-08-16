"use client";

import { useState } from "react";
import type { Localizacao } from "@/components/entidades/localizacao";

interface Props {
  localizacoes: Localizacao[];
  onSelect: (local: Localizacao | null) => void;
}

export default function LocalizacaoCalendario({
  localizacoes,
  onSelect,
}: Props) {
  const [modo, setModo] = useState<"escolher" | "gps">("escolher");
  const [texto, setTexto] = useState("");

  const resultados = texto.trim()
    ? localizacoes
        .filter((local) =>
          [
            local.nome,
            local.localidade,
            local.municipio,
            local.distrito,
            local.codigo_postal,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(texto.toLowerCase())
        )
        .slice(0, 10)
    : [];

  function usarGPS() {
    if (!navigator.geolocation) {
      alert("A localização automática não é suportada neste dispositivo.");
      return;
    }

    setModo("gps");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSelect({
          id: 0,
          codigo_postal: "",
          nome: "Localização atual",
          localidade: "",
          municipio: "",
          distrito: "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setModo("escolher");
        alert("Não foi possível obter a tua localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-900 mb-3">
        Meteorologia
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={usarGPS}
          className={
            "px-4 py-2 rounded-full text-sm font-medium " +
            (modo === "gps"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          📍 Usar a minha localização
        </button>

        <button
          type="button"
          onClick={() => setModo("escolher")}
          className={
            "px-4 py-2 rounded-full text-sm font-medium " +
            (modo === "escolher"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          🔎 Escolher localização
        </button>
      </div>

      {modo === "escolher" && (
        <div className="relative">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Freguesia, localidade, município ou código postal..."
            className="w-full border rounded-lg p-3"
          />

          {resultados.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {resultados.map((local) => (
                <button
                  key={local.id}
                  type="button"
                  onClick={() => {
                    setTexto(local.nome);
                    onSelect(local);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
                >
                  <div className="font-medium">
                    📍 {local.nome}
                  </div>
                  <div className="text-xs text-slate-500">
                    {[
                      local.codigo_postal,
                      local.localidade,
                      local.municipio,
                      local.distrito,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {modo === "gps" && (
        <p className="text-sm text-slate-600">
          A obter a tua localização...
        </p>
      )}
    </div>
  );
}
