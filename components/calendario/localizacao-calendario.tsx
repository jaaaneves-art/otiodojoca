"use client";

import { useState } from "react";
import type { Localizacao } from "@/components/entidades/localizacao";
import LocalizacaoCascata from "@/components/calendario/localizacao-cascata";

interface Props {
  onSelect: (local: Localizacao | null) => void;
}

export default function LocalizacaoCalendario({ onSelect }: Props) {
  const [modo, setModo] = useState<"escolher" | "gps">("escolher");

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
          onClick={() => {
            setModo("escolher");
            onSelect(null);
          }}
          className={
            "px-4 py-2 rounded-full text-sm font-medium " +
            (modo === "escolher"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          🔎 Escolher município e freguesia
        </button>
      </div>

      {modo === "escolher" && <LocalizacaoCascata onSelect={onSelect} />}

      {modo === "gps" && (
        <p className="text-sm text-slate-600">
          A obter a tua localização...
        </p>
      )}
    </div>
  );
}
