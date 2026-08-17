"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarFoto,
  adicionarNota,
  atualizarEstadoPlantacao,
} from "@/lib/agenda-agricola/actions";
import { ESTADO_LABEL, type EstadoPlantacao } from "@/lib/agenda-agricola/tipos";

interface Props {
  plantacaoId: number;
  proximoEstado?: EstadoPlantacao;
  podeCancelar: boolean;
  fotografias: string[];
}

export default function FichaInterativa({
  plantacaoId,
  proximoEstado,
  podeCancelar,
  fotografias,
}: Props) {
  const router = useRouter();
  const [pendingEstado, startTransitionEstado] = useTransition();
  const [erroEstado, setErroEstado] = useState<string | null>(null);

  const [pendingNota, startTransitionNota] = useTransition();
  const [erroNota, setErroNota] = useState<string | null>(null);

  const [pendingFoto, startTransitionFoto] = useTransition();
  const [erroFoto, setErroFoto] = useState<string | null>(null);

  function mudarEstado(novoEstado: EstadoPlantacao) {
    setErroEstado(null);
    startTransitionEstado(async () => {
      const resultado = await atualizarEstadoPlantacao(plantacaoId, novoEstado);
      if (resultado.sucesso) {
        router.refresh();
      } else {
        setErroEstado(resultado.erro ?? "Não foi possível atualizar.");
      }
    });
  }

  function submeterNota(formData: FormData) {
    setErroNota(null);
    startTransitionNota(async () => {
      const resultado = await adicionarNota(plantacaoId, formData);
      if (resultado.sucesso) {
        router.refresh();
      } else {
        setErroNota(resultado.erro ?? "Não foi possível adicionar a nota.");
      }
    });
  }

  function submeterFoto(formData: FormData) {
    setErroFoto(null);
    startTransitionFoto(async () => {
      const resultado = await adicionarFoto(plantacaoId, formData);
      if (resultado.sucesso) {
        router.refresh();
      } else {
        setErroFoto(resultado.erro ?? "Não foi possível adicionar a foto.");
      }
    });
  }

  return (
    <>
      {(proximoEstado || podeCancelar) && (
        <div>
          {erroEstado && <p className="text-sm text-rose-700 mb-2">{erroEstado}</p>}
          <div className="flex gap-2 mt-5">
            {proximoEstado && (
              <button
                type="button"
                disabled={pendingEstado}
                onClick={() => mudarEstado(proximoEstado)}
                className="bg-terra-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-terra-800 disabled:opacity-50"
              >
                {pendingEstado ? "A atualizar..." : `Marcar como ${ESTADO_LABEL[proximoEstado]}`}
              </button>
            )}
            {podeCancelar && (
              <button
                type="button"
                disabled={pendingEstado}
                onClick={() => mudarEstado("cancelada")}
                className="text-terra-500 px-4 py-2 rounded-full text-sm hover:bg-terra-100 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-bold text-terra-900 mb-3">Adicionar nota</h3>
        {erroNota && <p className="text-sm text-rose-700 mb-2">{erroNota}</p>}
        <form action={submeterNota} className="flex gap-2">
          <input
            type="text"
            name="texto"
            placeholder="Ex: primeiras folhas a aparecer"
            className="flex-1 border rounded-lg p-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={pendingNota}
            className="bg-terra-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-terra-800 disabled:opacity-50"
          >
            {pendingNota ? "A adicionar..." : "Adicionar"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-bold text-terra-900 mb-3">Adicionar foto</h3>
        <p className="text-xs text-terra-500 mb-3">
          Por agora, cola o link de uma foto (upload direto fica para depois).
        </p>
        {erroFoto && <p className="text-sm text-rose-700 mb-2">{erroFoto}</p>}
        <form action={submeterFoto} className="flex gap-2">
          <input
            type="url"
            name="url"
            placeholder="https://..."
            className="flex-1 border rounded-lg p-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={pendingFoto}
            className="bg-terra-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-terra-800 disabled:opacity-50"
          >
            {pendingFoto ? "A adicionar..." : "Adicionar"}
          </button>
        </form>
        {fotografias.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {fotografias.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="rounded-lg aspect-square object-cover" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
