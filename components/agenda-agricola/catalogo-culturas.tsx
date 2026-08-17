"use client";

import { useMemo, useState } from "react";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";
import CulturaDetalhesModal from "./cultura-detalhes-modal";

function textoCiclo(c: CulturaGuia): string {
  if (c.perene) return "Perene";
  if (c.ciclo_dias_min != null && c.ciclo_dias_max != null) {
    return `${c.ciclo_dias_min}–${c.ciclo_dias_max} dias`;
  }
  return "Ciclo por confirmar";
}

function nomeFaseLunar(fase?: string | null): string | null {
  if (!fase || fase === "qualquer") return null;
  if (fase === "crescente") return "Lua Crescente";
  if (fase === "minguante") return "Lua Minguante";
  return fase;
}

function ehAlturaDeSemear(mesesSemeadura?: string | null): boolean {
  if (!mesesSemeadura) return false;
  const mesAtual = new Date().toLocaleString("pt-PT", { month: "long" }).toLowerCase();
  return mesesSemeadura.toLowerCase().includes(mesAtual);
}

export default function CatalogoCulturas({ culturas }: { culturas: CulturaGuia[] }) {
  const [texto, setTexto] = useState("");
  const [culturaSelecionada, setCulturaSelecionada] = useState<CulturaGuia | null>(null);

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
        {filtradas.map((c) => {
          const faseLunar = nomeFaseLunar(c.semeadura_fase_lunar);
          const alturaDeSemear = ehAlturaDeSemear(c.meses_semeadura);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCulturaSelecionada(c)}
              className="rounded-lg border border-terra-200 p-3 text-left bg-white hover:border-terra-400 hover:bg-terra-50 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-terra-800">{c.nome}</span>
                <span className="text-xs bg-terra-100 text-terra-700 px-2 py-0.5 rounded-full">
                  {c.categoria}
                </span>
              </div>

              {faseLunar ? (
                <p className="text-xs text-indigo-600 font-semibold mt-1">🌙 {faseLunar}</p>
              ) : (
                <p className="text-xs text-terra-500 mt-1">{textoCiclo(c)}</p>
              )}

              {alturaDeSemear && (
                <p className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded mt-2 inline-block">
                  ✓ Altura de semear
                </p>
              )}
            </button>
          );
        })}
        {filtradas.length === 0 && (
          <p className="text-sm text-terra-500 col-span-full">Nenhuma cultura encontrada.</p>
        )}
      </div>

      <CulturaDetalhesModal
        cultura={culturaSelecionada}
        open={culturaSelecionada !== null}
        onOpenChange={(open) => !open && setCulturaSelecionada(null)}
      />
    </div>
  );
}
