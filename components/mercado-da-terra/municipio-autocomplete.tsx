"use client";

import { useState } from "react";

interface Municipio {
  nome: string;
  distrito_regiao: string;
}

export function MunicipioAutocomplete({ municipios, valorInicial = "" }: { municipios: Municipio[]; valorInicial?: string }) {
  const [texto, setTexto] = useState(valorInicial);
  const [aberto, setAberto] = useState(false);

  const sugestoes =
    texto.length < 2
      ? []
      : municipios
          .filter((m) => m.nome.toLowerCase().includes(texto.toLowerCase()))
          .slice(0, 8);

  return (
    <div className="relative">
      <label className="text-sm font-medium">Localidade *</label>
      <input
        name="location"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Comeca a escrever o concelho..."
        autoComplete="off"
        required
        className="w-full border rounded-lg p-2 mt-1"
      />
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-terra-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
          {sugestoes.map((m) => (
            <li
              key={m.nome + m.distrito_regiao}
              onMouseDown={() => {
                setTexto(m.nome);
                setAberto(false);
              }}
              className="px-3 py-2 hover:bg-terra-50 cursor-pointer text-sm"
            >
              {m.nome}
              <span className="text-terra-400 ml-2">{m.distrito_regiao}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

