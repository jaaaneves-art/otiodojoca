"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Landmark, Search, X } from "lucide-react";

// Autocomplete de Município COM id real, para uso em fluxos que precisam
// de gravar municipio_id (FK) — ex.: /participar. Não confundir com
// components/entidades/municipios/municipio-autocomplete.tsx, que é um
// componente diferente, já usado no ad-form do marketplace para um campo
// de localização em texto livre (sem id). Esse componente não é alterado
// aqui — este é um irmão novo, desenhado com o mesmo tipo de interacção
// (procurar -> lista de resultados -> cartão de seleccionado) que já
// existe em components/entidades/freguesias/freguesia-autocomplete.tsx,
// mas com uma linguagem visual institucional própria (ícone 🏛️),
// distinta da linguagem mais territorial/comunitária da Freguesia (🏘️).

export interface MunicipioOption {
  id: number;
  nome: string;
  distrito_regiao: string;
}

interface MunicipioIdAutocompleteProps {
  municipios: MunicipioOption[];
  value: MunicipioOption | null;
  onSelect: (municipio: MunicipioOption | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
}

export function MunicipioIdAutocomplete({
  municipios,
  value,
  onSelect,
  label = "Município / Concelho",
  placeholder = "Comece a escrever o município...",
  required = true,
  error,
}: MunicipioIdAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();

  const filtrados =
    inputValue.trim().length === 0
      ? []
      : municipios
          .filter(
            (m) =>
              m.nome.toLowerCase().includes(inputValue.toLowerCase()) ||
              m.distrito_regiao.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 8);

  useEffect(() => {
    setIsOpen(filtrados.length > 0);
    setHighlighted(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selecionar(m: MunicipioOption) {
    onSelect(m);
    setInputValue("");
    setIsOpen(false);
  }

  function limpar() {
    onSelect(null);
    setInputValue("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || filtrados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const escolhido = filtrados[highlighted];
      if (escolhido) selecionar(escolhido);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-terra-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-terra-300 bg-terra-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-terra-700">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-terra-900">{value.nome}</p>
              <p className="text-xs text-terra-600">Município seleccionado — {value.distrito_regiao}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={limpar}
            aria-label="Remover município seleccionado"
            className="rounded-lg p-1.5 text-terra-500 hover:bg-white hover:text-terra-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terra-400"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={isOpen && filtrados[highlighted] ? `${listId}-${filtrados[highlighted].id}` : undefined}
            aria-required={required}
            aria-invalid={!!error}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => filtrados.length > 0 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-terra-200 bg-white py-3 pl-10 pr-4 text-sm text-terra-900 outline-none transition placeholder:text-terra-400 focus:border-terra-500 focus:ring-4 focus:ring-terra-100"
          />

          {isOpen && (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-terra-200 bg-white shadow-lg"
            >
              {filtrados.map((m, idx) => (
                <li key={m.id} role="option" aria-selected={idx === highlighted} id={`${listId}-${m.id}`}>
                  <button
                    type="button"
                    onClick={() => selecionar(m)}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`flex w-full items-center gap-3 border-b border-terra-100 px-4 py-2.5 text-left last:border-b-0 ${
                      idx === highlighted ? "bg-terra-50" : "hover:bg-terra-50"
                    }`}
                  >
                    <Landmark className="h-4 w-4 shrink-0 text-terra-500" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium text-terra-900">{m.nome}</span>
                      <span className="block text-xs text-terra-500">Distrito de {m.distrito_regiao}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isOpen && inputValue && filtrados.length === 0 && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-terra-200 bg-white p-4 text-center text-sm text-terra-500 shadow-lg">
              Nenhum município encontrado
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
