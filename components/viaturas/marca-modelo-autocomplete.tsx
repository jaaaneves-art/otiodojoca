"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MARCAS, getModelos } from "@/lib/viaturas/marcas-modelos";

interface MarcaModeloAutocompleteProps {
  marcaInicial?: string;
  modeloInicial?: string;
  marcaObrigatoria?: boolean;
  modeloObrigatorio?: boolean;
}

// Segue o mesmo padrão do MunicipioAutocomplete
// (components/mercado-da-terra/municipio-autocomplete.tsx): inputs de texto
// livres com sugestões por baixo, não um <select> — o utilizador continua a
// poder escrever marcas/modelos fora da lista (carros mais raros,
// importações). O modelo mostra só sugestões da marca escolhida, mas não é
// bloqueado por ela.
export function MarcaModeloAutocomplete({
  marcaInicial = "",
  modeloInicial = "",
  marcaObrigatoria = false,
  modeloObrigatorio = false,
}: MarcaModeloAutocompleteProps) {
  const [marca, setMarca] = useState(marcaInicial);
  const [modelo, setModelo] = useState(modeloInicial);
  const [marcaAberta, setMarcaAberta] = useState(false);
  const [modeloAberto, setModeloAberto] = useState(false);
  const marcaRef = useRef<HTMLDivElement>(null);
  const modeloRef = useRef<HTMLDivElement>(null);

  const marcasFiltradas = useMemo(() => {
    const q = marca.trim().toLowerCase();
    if (!q) return MARCAS;
    return MARCAS.filter((m) => m.toLowerCase().includes(q));
  }, [marca]);

  const modelosDaMarca = useMemo(() => getModelos(marca), [marca]);

  const modelosFiltrados = useMemo(() => {
    const q = modelo.trim().toLowerCase();
    if (!q) return modelosDaMarca;
    return modelosDaMarca.filter((m) => m.toLowerCase().includes(q));
  }, [modelo, modelosDaMarca]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
        setMarcaAberta(false);
      }
      if (modeloRef.current && !modeloRef.current.contains(event.target as Node)) {
        setModeloAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selecionarMarca = (valor: string) => {
    setMarca(valor);
    setMarcaAberta(false);
    // Se o modelo já escrito não pertence à marca nova, limpa — evita
    // ficar "BMW" + "Clio" depois de trocar de marca.
    const modelosNovos = getModelos(valor);
    if (modelo && modelosNovos.length > 0 && !modelosNovos.includes(modelo)) {
      setModelo("");
    }
  };

  const selecionarModelo = (valor: string) => {
    setModelo(valor);
    setModeloAberto(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div ref={marcaRef} className="relative">
        <label className="text-sm font-medium">Marca{marcaObrigatoria && " *"}</label>
        <input
          type="text"
          name="marca"
          value={marca}
          onChange={(e) => {
            setMarca(e.target.value);
            setMarcaAberta(true);
          }}
          onFocus={() => setMarcaAberta(true)}
          placeholder="Ex: BMW"
          required={marcaObrigatoria}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1"
        />
        {marcaAberta && marcasFiltradas.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {marcasFiltradas.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selecionarMarca(m)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={modeloRef} className="relative">
        <label className="text-sm font-medium">Modelo{modeloObrigatorio && " *"}</label>
        <input
          type="text"
          name="modelo"
          value={modelo}
          onChange={(e) => {
            setModelo(e.target.value);
            setModeloAberto(true);
          }}
          onFocus={() => {
            if (modelosFiltrados.length > 0) setModeloAberto(true);
          }}
          placeholder={modelosDaMarca.length > 0 ? `Ex: ${modelosDaMarca[0]}` : "Ex: Série 3"}
          required={modeloObrigatorio}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1"
        />
        {modeloAberto && modelosFiltrados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {modelosFiltrados.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selecionarModelo(m)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
