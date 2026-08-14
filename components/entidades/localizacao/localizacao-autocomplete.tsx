"use client";

import { useMemo, useState } from "react";
import type { Localizacao } from "./tipos";

interface Props {
  locais: Localizacao[];
  name?: string;
  placeholder?: string;
  obrigatorio?: boolean;
  onSelect?: (local: Localizacao | null) => void;
}

export function LocalizacaoAutocomplete({
  locais,
  name = "localizacao_id",
  placeholder = "Procura uma freguesia, município ou localidade...",
  obrigatorio = false,
  onSelect,
}: Props) {
  const [texto, setTexto] = useState("");
  const [selecionado, setSelecionado] = useState<Localizacao | null>(null);
  const [aberto, setAberto] = useState(false);

  const resultados = useMemo(() => {
    const procura = texto.trim().toLowerCase();

    if (!procura) return [];

    return locais
      .filter((local) =>
        [
          local.codigo_postal,
          local.nome,
          local.municipio ?? "",
          local.localidade,
          local.distrito ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(procura)
      )
      .slice(0, 10);
  }, [texto, locais]);

  function selecionar(local: Localizacao) {
    setSelecionado(local);
    setTexto(local.nome);
    setAberto(false);
    onSelect?.(local);
  }

  function limpar() {
    setTexto("");
    setSelecionado(null);
    setAberto(false);
    onSelect?.(null);
  }

  return (
    <div className="relative">
      <input
        type="hidden"
        name={name}
        value={selecionado?.id ?? ""}
      />

      <input
        type="hidden"
        name={`${name}_latitude`}
        value={selecionado?.latitude ?? ""}
      />

      <input
        type="hidden"
        name={`${name}_longitude`}
        value={selecionado?.longitude ?? ""}
      />

      <div className="relative">
        <input
          type="text"
          value={texto}
          required={obrigatorio}
          placeholder={placeholder}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            setSelecionado(null);
            setAberto(true);
          }}
          className="w-full border rounded-lg p-2 pr-10"
        />

        {texto && (
          <button
            type="button"
            onClick={limpar}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            ✕
          </button>
        )}
      </div>

      {aberto && texto && resultados.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {resultados.map((local) => (
            <button
              key={local.id}
              type="button"
              onClick={() => selecionar(local)}
              className="w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-terra-50"
            >
              <div className="font-medium">📍 {local.nome}</div>
              <div className="text-xs text-gray-600">
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

      {aberto && texto && resultados.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-white p-3 text-sm text-gray-500 shadow-lg">
          Nenhuma localização encontrada.
        </div>
      )}
    </div>
  );
}
