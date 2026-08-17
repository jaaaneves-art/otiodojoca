"use client";

import { useMemo, useState } from "react";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";

function textoCiclo(c: CulturaGuia): string {
  if (c.perene) return "Perene";
  if (c.ciclo_dias_min != null && c.ciclo_dias_max != null) {
    return `${c.ciclo_dias_min}–${c.ciclo_dias_max} dias`;
  }
  return "Ciclo por confirmar";
}

export default function CatalogoCulturas({ culturas }: { culturas: CulturaGuia[] }) {
  const [texto, setTexto] = useState("");

  const filtradas = useMemo(() => {
    const termo = texto.trim().toLowerCase();
    if (!termo) return culturas;
    return culturas.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.categoria.toLowerCase().includes(termo),
    );
  }, [texto, culturas]);

  return (
    <div>
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Procura uma cultura (ex: tomate, cereal)..."
        className="w-full border rounded-lg p-3 mb-4"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtradas.map((c) => (
          <div key={c.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-terra-800">{c.nome}</span>
              <span className="text-xs bg-terra-100 text-terra-700 px-2 py-0.5 rounded-full">
                {c.categoria}
              </span>
            </div>
            <p className="text-xs text-terra-500 mt-1">{textoCiclo(c)}</p>
            {c.semeadura_fase_lunar && c.semeadura_fase_lunar !== "qualquer" && (
              <p className="text-xs text-terra-500">
                Sementeira em Lua {c.semeadura_fase_lunar === "crescente" ? "Crescente" : "Minguante"}
              </p>
            )}
          </div>
        ))}
        {filtradas.length === 0 && (
          <p className="text-sm text-terra-500 col-span-full">Nenhuma cultura encontrada.</p>
        )}
      </div>
    </div>
  );
}
