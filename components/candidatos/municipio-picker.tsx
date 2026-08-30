"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface MunicipioOpt {
  id: number;
  nome: string;
  distrito_regiao: string;
}

interface MunicipioPickerProps {
  municipios: MunicipioOpt[];
  valorInicialLabel?: string;
  onChange: (id: number | null, label: string) => void;
}

/**
 * Autocomplete de município que resolve para um `municipio_id` (bigint),
 * ao contrário do MunicipioAutocomplete de mercado-da-terra (que guarda só
 * o texto). Enquanto o utilizador escreve sem escolher uma sugestão da
 * lista, o id fica a null — só fica preenchido depois de um clique.
 */
export function MunicipioPicker({
  municipios,
  valorInicialLabel = "",
  onChange,
}: MunicipioPickerProps) {
  const [inputValue, setInputValue] = useState(valorInicialLabel);
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

  function handleInputChange(value: string) {
    setInputValue(value);
    setIsOpen(true);
    // Enquanto não há seleção de uma sugestão, o id fica por resolver.
    onChange(null, value);
  }

  function handleSelect(m: MunicipioOpt) {
    const label = `${m.nome}, ${m.distrito_regiao}`;
    setInputValue(label);
    setIsOpen(false);
    onChange(m.id, label);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
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
