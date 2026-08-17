"use client";

import { useState } from "react";
import { Thermometer, Droplets, Leaf, Info } from "lucide-react";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";
import CulturaDetalhesModal from "./cultura-detalhes-modal";

export default function CulturaInfoCard({ cultura }: { cultura: CulturaGuia }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-terra-50 to-white border border-terra-200 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-terra-900">{cultura.nome}</h3>
            {cultura.nome_cientifico && (
              <p className="text-xs italic text-terra-500 mt-0.5">{cultura.nome_cientifico}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAberto(true)}
            title="Ver detalhes desta cultura"
            className="text-terra-500 hover:text-terra-700 border border-terra-200 rounded-full p-1.5 flex-shrink-0"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-terra-700">
            <Leaf className="w-4 h-4 text-green-600" />
            <span>
              <strong>Ciclo:</strong>{" "}
              {cultura.perene
                ? "Perene"
                : cultura.ciclo_dias_min != null && cultura.ciclo_dias_max != null
                  ? `${cultura.ciclo_dias_min}–${cultura.ciclo_dias_max} dias`
                  : "Por confirmar"}
            </span>
          </div>
          {cultura.temp_otima != null && (
            <div className="flex items-center gap-2 text-terra-700">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>
                <strong>Ideal:</strong> {cultura.temp_otima}°C
              </span>
            </div>
          )}
          {cultura.humidade_ideal && (
            <div className="flex items-center gap-2 text-terra-700">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>
                <strong>Humidade:</strong> {cultura.humidade_ideal}
              </span>
            </div>
          )}
          {cultura.meses_semeadura && (
            <p className="pt-2 mt-2 border-t border-terra-200 text-xs text-terra-500">
              <strong>Semeadura:</strong> {cultura.meses_semeadura}
            </p>
          )}
        </div>
      </div>

      <CulturaDetalhesModal cultura={cultura} open={aberto} onOpenChange={setAberto} />
    </>
  );
}
