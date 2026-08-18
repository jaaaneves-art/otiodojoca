"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarEstadoPlantacao } from "@/lib/agenda-agricola/actions";
import { ESTADO_LABEL, type EstadoPlantacao, type Fotografia } from "@/lib/agenda-agricola/tipos";

interface Props {
  plantacaoId: number;
  proximoEstado?: EstadoPlantacao;
  podeCancelar: boolean;
  fotografias: Fotografia[] | null;
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
                onClick={() => mudarEstado("interrompido")}
                className="text-terra-500 px-4 py-2 rounded-full text-sm hover:bg-terra-100 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {fotografias && fotografias.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-bold text-terra-900 mb-3">Fotografias</h3>
          <div className="grid grid-cols-3 gap-2">
            {fotografias.map((foto) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto.id}
                src={foto.url}
                alt={foto.descricao || "Foto da plantação"}
                className="rounded-lg aspect-square object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
