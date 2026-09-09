// components/marketplace/cae-autocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { pesquisarCae, obterCaePorCodigo } from '@/lib/marketplace/cae';

interface CaeAutocompleteProps {
  value: string;
  onChange: (codigo: string) => void;
  id?: string;
}

export function CaeAutocomplete({ value, onChange, id }: CaeAutocompleteProps) {
  const existente = value ? obterCaePorCodigo(value) : undefined;
  const [inputValue, setInputValue] = useState(
    existente ? `${existente.codigo} — ${existente.descricao}` : value || ''
  );
  const [resultados, setResultados] = useState(
    () => [] as ReturnType<typeof pesquisarCae>
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (texto: string) => {
    setInputValue(texto);

    if (texto.trim().length === 0) {
      setResultados([]);
      setIsOpen(false);
      onChange('');
      return;
    }

    setResultados(pesquisarCae(texto, 10));
    setIsOpen(true);
    // Só confirma o código quando corresponde exatamente a uma entrada da lista
    const correspondeExato = obterCaePorCodigo(texto.trim());
    onChange(correspondeExato ? correspondeExato.codigo : '');
  };

  const handleSelect = (codigo: string, descricao: string) => {
    setInputValue(`${codigo} — ${descricao}`);
    onChange(codigo);
    setIsOpen(false);
    setResultados([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setResultados([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => resultados.length > 0 && setIsOpen(true)}
          placeholder="Código ou nome da atividade (ex: 47111 ou cabeleireiro)"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar"
          >
            ✕
          </button>
        )}

        {isOpen && resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {resultados.map((r) => (
              <button
                key={r.codigo}
                type="button"
                onClick={() => handleSelect(r.codigo, r.descricao)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 transition"
              >
                <div className="font-medium text-sm">{r.codigo}</div>
                <div className="text-xs text-gray-600">{r.descricao}</div>
              </button>
            ))}
          </div>
        )}

        {isOpen && inputValue && resultados.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
            Nenhum código CAE encontrado
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">Opcional — ajuda a categorizar a atividade</p>
    </div>
  );
}
