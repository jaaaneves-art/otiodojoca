"use client";

import { useState, useRef, useEffect } from "react";

interface Municipio {
  nome: string;
  distrito_regiao: string;
}

interface MunicipioAutocompleteProps {
  municipios: Municipio[];
  valorInicial?: string;
}

export function MunicipioAutocomplete({
  municipios,
  valorInicial = "",
}: MunicipioAutocompleteProps) {
  const [inputValue, setInputValue] = useState(valorInicial);
  const [isOpen, setIsOpen] = useState(false);
  const [filtrados, setFiltrados] = useState<Municipio[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setFiltrados([]);
      setIsOpen(false);
      return;
    }

    const query = inputValue.toLowerCase();
    const matches = municipios.filter(
      (m) =>
        m.nome.toLowerCase().includes(query) ||
        m.distrito_regiao.toLowerCase().includes(query)
    );

    setFiltrados(matches);
    setIsOpen(matches.length > 0);
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

  const handleSelect = (municipio: Municipio) => {
    setInputValue(`${municipio.nome}, ${municipio.distrito_regiao}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium block mb-2">Localização *</label>
      <input
        ref={inputRef}
        type="text"
        name="location"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (filtrados.length > 0) setIsOpen(true);
        }}
        placeholder="Ex: Lisboa, Lisboa"
        required
        className="w-full border rounded-lg p-2"
      />

      {isOpen && filtrados.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-terra-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtrados.map((municipio, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(municipio)}
              className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b border-terra-100 last:border-b-0"
            >
              <div className="font-medium text-terra-800">{municipio.nome}</div>
              <div className="text-xs text-terra-600">{municipio.distrito_regiao}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
