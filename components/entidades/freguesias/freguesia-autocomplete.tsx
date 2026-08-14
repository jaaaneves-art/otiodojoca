"use client";

import { useState, useEffect } from "react";

interface Freguesia {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
  localidade: string;
  email?: string;
  telefone?: string;
}

interface FreguesiaAutocompleteProps {
  freguesias: Freguesia[];
  valorInicial?: string;
  onFreguesiaSelect?: (freguesia: Freguesia | null) => void;
}

export function FreguesiaAutocomplete({
  freguesias,
  valorInicial = "",
  onFreguesiaSelect,
}: FreguesiaAutocompleteProps) {
  const [inputValue, setInputValue] = useState(valorInicial);
  const [suggestions, setSuggestions] = useState<Freguesia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFreguesia, setSelectedFreguesia] = useState<Freguesia | null>(
    null
  );

  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = freguesias.filter((f) =>
      f.nome.toLowerCase().includes(inputValue.toLowerCase()) ||
      f.municipio.toLowerCase().includes(inputValue.toLowerCase()) ||
      f.localidade.toLowerCase().includes(inputValue.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 10));
    setIsOpen(true);
  }, [inputValue, freguesias]);

  const handleSelect = (freguesia: Freguesia) => {
    setInputValue(`${freguesia.nome} (${freguesia.municipio})`);
    setSelectedFreguesia(freguesia);
    setIsOpen(false);
    if (onFreguesiaSelect) {
      onFreguesiaSelect(freguesia);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedFreguesia(null);
    setSuggestions([]);
    setIsOpen(false);
    if (onFreguesiaSelect) {
      onFreguesiaSelect(null);
    }
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium">Freguesia *</label>

      <div className="relative mt-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => inputValue.length > 0 && setIsOpen(true)}
          placeholder="Procura pela freguesia, município ou localidade..."
          className="w-full border rounded-lg p-2"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}

        <input
          type="hidden"
          name="freguesia_id"
          value={selectedFreguesia?.id ?? ""}
        />

        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {suggestions.map((freguesia) => (
              <button
                key={freguesia.id}
                type="button"
                onClick={() => handleSelect(freguesia)}
                className="w-full text-left px-4 py-2 hover:bg-terra-50 border-b last:border-b-0 transition"
              >
                <div className="font-medium">{freguesia.nome}</div>
                <div className="text-xs text-gray-600">
                  {freguesia.municipio} • {freguesia.localidade}
                </div>
                {freguesia.email && (
                  <div className="text-xs text-gray-500">{freguesia.email}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {isOpen && inputValue && suggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
            Nenhuma freguesia encontrada
          </div>
        )}
      </div>

      {selectedFreguesia && (
        <div className="mt-2 p-2 bg-terra-50 rounded-lg text-sm">
          <div>
            <strong>{selectedFreguesia.nome}</strong>
          </div>
          <div className="text-gray-600">
            {selectedFreguesia.municipio} • {selectedFreguesia.localidade}
          </div>
          {selectedFreguesia.email && (
            <div className="text-gray-600">{selectedFreguesia.email}</div>
          )}
        </div>
      )}
    </div>
  );
}
