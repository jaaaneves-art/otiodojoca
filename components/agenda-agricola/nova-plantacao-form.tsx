"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { criarPlantacao } from "@/lib/agenda-agricola/actions";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";
import CulturaDetalhesModal from "./cultura-detalhes-modal";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NovaPlantacaoForm({ culturas }: { culturas: CulturaGuia[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [culturaId, setCulturaId] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const culturaSelecionada = culturas.find((c) => String(c.id) === culturaId);

  function submeter(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await criarPlantacao(formData);
      if (resultado.sucesso && resultado.plantacaoId) {
        router.push(`/agenda-agricola/plantacao/${resultado.plantacaoId}`);
      } else {
        setErro(resultado.erro ?? "Não foi possível criar a plantação.");
      }
    });
  }

  if (culturas.length === 0) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
        Catálogo de culturas vazio — verifica se sql/AGENDA_AGRICOLA.sql e
        sql/culturas_guia_seed.sql já foram corridos no Supabase.
      </p>
    );
  }

  return (
    <form action={submeter} className="bg-white rounded-2xl border p-6 space-y-4">
      {erro && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{erro}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-terra-700 mb-1">Cultura</label>
        <div className="flex gap-2">
          <select
            name="cultura_id"
            required
            value={culturaId}
            onChange={(e) => setCulturaId(e.target.value)}
            className="flex-1 border rounded-lg p-3"
          >
            <option value="" disabled>
              Escolhe uma cultura...
            </option>
            {culturas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.categoria})
              </option>
            ))}
          </select>
          {culturaSelecionada && (
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              title="Ver detalhes desta cultura"
              className="border rounded-lg px-3 text-terra-600 hover:bg-terra-50 flex-shrink-0"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {culturaSelecionada && (
        <div className="rounded-lg bg-terra-50 border border-terra-200 p-3 text-sm text-terra-700">
          <p className="font-medium">{culturaSelecionada.nome}</p>
          <p>
            {culturaSelecionada.perene
              ? "Cultura perene"
              : culturaSelecionada.ciclo_dias_min != null && culturaSelecionada.ciclo_dias_max != null
                ? `Ciclo: ${culturaSelecionada.ciclo_dias_min}–${culturaSelecionada.ciclo_dias_max} dias`
                : "Ciclo por confirmar"}
          </p>
          {culturaSelecionada.dicas && <p className="mt-1 italic">{culturaSelecionada.dicas}</p>}
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="mt-2 text-terra-600 hover:text-terra-800 underline text-xs font-medium"
          >
            Ver informação completa →
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-terra-700 mb-1">Data de plantação</label>
        <input
          type="date"
          name="data_plantacao"
          required
          defaultValue={hojeISO()}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-terra-700 mb-1">
          Localização (opcional)
        </label>
        <input
          type="text"
          name="local_nome"
          placeholder="Ex: Horta 2, Talhão A"
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-terra-700 mb-1">Notas (opcional)</label>
        <textarea
          name="notas"
          rows={3}
          placeholder="Ex: variedade, origem das sementes..."
          className="w-full border rounded-lg p-3"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !culturaId}
        className="w-full bg-terra-700 text-white py-3 rounded-full font-medium hover:bg-terra-800 disabled:opacity-50"
      >
        {pending ? "A registar..." : "Registar plantação"}
      </button>

      <CulturaDetalhesModal
        cultura={culturaSelecionada ?? null}
        open={modalAberto}
        onOpenChange={setModalAberto}
      />
    </form>
  );
}
