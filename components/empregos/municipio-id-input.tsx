"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface MunicipioOpt {
  id: number;
  nome: string;
  distrito_regiao: string;
}

interface MunicipioIdInputProps {
  municipios: MunicipioOpt[];
  valorInicialId?: number | null;
  valorInicialLabel?: string;
}

/**
 * Variante de components/candidatos/municipio-picker.tsx pensada para
 * formulários baseados em FormData + server action (como job-form.tsx) em
 * vez de estado controlado pelo componente-pai: em vez de um callback
 * onChange, expõe o id resolvido através de um <input type="hidden"
 * name="municipio_id">, tal como o LocalSelector de components/entidades
 * faz para freguesia_id.
 */
export function MunicipioIdInput({
  municipios,
  valorInicialId = null,
  valorInicialLabel = "",
}: MunicipioIdInputProps) {
  const [inputValue, setInputValue] = useState(valorInicialLabel);
  const [municipioId, setMunicipioId] = useState<number | null>(valorInicialId);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtrados = useMemo(() => {
    if (inputValue.trim() === "") return [];
    const query = inputValue.toLowerCase();
    return municipios
      .filter(
        (m) =>
          m.nome.toLowerCase().includes(query) ||
          m.distrito_regiao.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [inputValue, municipios]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(m: MunicipioOpt) {
    setInputValue(`${m.nome}, ${m.distrito_regiao}`);
    setMunicipioId(m.id);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="municipio_id" value={municipioId ?? ""} />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setMunicipioId(null);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (filtrados.length > 0) setIsOpen(true);
        }}
        placeholder="Ex: Lisboa, Lisboa"
        className="w-full border rounded-lg p-2"
      />
      {isOpen && filtrados.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-terra-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtrados.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m)}
              className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b border-terra-100 last:border-b-0"
            >
              <div className="font-medium text-terra-800">{m.nome}</div>
              <div className="text-xs text-terra-600">{m.distrito_regiao}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
