"use client";

import { Thermometer, Droplets, Leaf, BookOpen, Lightbulb, X } from "lucide-react";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";

interface Props {
  cultura: CulturaGuia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function faseLabel(fase: string): string {
  if (fase === "crescente") return "Lua Crescente";
  if (fase === "minguante") return "Lua Minguante";
  return "Qualquer fase";
}

export default function CulturaDetalhesModal({ cultura, open, onOpenChange }: Props) {
  if (!open || !cultura) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-terra-900">{cultura.nome}</h2>
            {cultura.nome_cientifico && (
              <p className="text-sm italic text-terra-500 mt-0.5">{cultura.nome_cientifico}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-terra-400 hover:text-terra-600 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-terra-50 p-3">
            <p className="text-xs text-terra-500">Categoria</p>
            <p className="font-semibold text-terra-800">{cultura.categoria}</p>
          </div>
          <div className="rounded-lg bg-terra-50 p-3">
            <p className="text-xs text-terra-500">Ciclo</p>
            <p className="font-semibold text-terra-800">
              {cultura.perene
                ? "Perene"
                : cultura.ciclo_dias_min != null && cultura.ciclo_dias_max != null
                  ? `${cultura.ciclo_dias_min}–${cultura.ciclo_dias_max} dias`
                  : "Por confirmar"}
            </p>
          </div>
        </div>

        {(cultura.temp_min_germinacao != null || cultura.temp_otima != null || cultura.humidade_ideal) && (
          <div className="border rounded-lg p-4 mb-4 space-y-2">
            <h3 className="font-semibold text-terra-900 text-sm">Condições ideais</h3>
            {cultura.temp_min_germinacao != null && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Thermometer className="w-4 h-4 text-rose-500" />
                Germinação mínima: {cultura.temp_min_germinacao}°C
              </div>
            )}
            {cultura.temp_otima != null && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Temperatura ótima: {cultura.temp_otima}°C
              </div>
            )}
            {cultura.humidade_ideal && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Droplets className="w-4 h-4 text-blue-500" />
                Humidade ideal: {cultura.humidade_ideal}
              </div>
            )}
          </div>
        )}

        {(cultura.meses_semeadura || cultura.meses_colheita || cultura.meses_poda) && (
          <div className="border rounded-lg p-4 mb-4 space-y-2">
            <h3 className="font-semibold text-terra-900 text-sm">Períodos ideais</h3>
            {cultura.meses_semeadura && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Leaf className="w-4 h-4 text-green-600" />
                Semeadura: {cultura.meses_semeadura}
              </div>
            )}
            {cultura.meses_poda && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Leaf className="w-4 h-4 text-emerald-600" />
                Poda: {cultura.meses_poda}
              </div>
            )}
            {cultura.meses_colheita && (
              <div className="flex items-center gap-2 text-sm text-terra-700">
                <Leaf className="w-4 h-4 text-amber-600" />
                Colheita: {cultura.meses_colheita}
              </div>
            )}
          </div>
        )}

        {cultura.descricao && (
          <div className="bg-terra-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-terra-600" />
              <h3 className="font-semibold text-terra-900 text-sm">Descrição</h3>
            </div>
            <p className="text-sm text-terra-700 leading-relaxed">{cultura.descricao}</p>
          </div>
        )}

        {(cultura.semeadura_fase_lunar || cultura.poda_fase_lunar || cultura.colheita_fase_lunar) && (
          <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 mb-4 space-y-1 text-sm">
            <h3 className="font-semibold text-indigo-900 mb-1">Fases lunares recomendadas</h3>
            {cultura.semeadura_fase_lunar && (
              <p className="text-indigo-800">
                <span className="font-medium">Semeadura:</span> {faseLabel(cultura.semeadura_fase_lunar)}
              </p>
            )}
            {cultura.poda_fase_lunar && (
              <p className="text-indigo-800">
                <span className="font-medium">Poda:</span> {faseLabel(cultura.poda_fase_lunar)}
              </p>
            )}
            {cultura.colheita_fase_lunar && (
              <p className="text-indigo-800">
                <span className="font-medium">Colheita:</span> {faseLabel(cultura.colheita_fase_lunar)}
              </p>
            )}
          </div>
        )}

        {cultura.associacoes_beneficas && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-green-700" />
              <h3 className="font-semibold text-green-900 text-sm">Associações benéficas</h3>
            </div>
            <p className="text-sm text-green-800">{cultura.associacoes_beneficas}</p>
          </div>
        )}

        {cultura.dicas && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 text-sm mb-1">💡 Dicas</h3>
            <p className="text-sm text-amber-800">{cultura.dicas}</p>
          </div>
        )}
      </div>
    </div>
  );
}
