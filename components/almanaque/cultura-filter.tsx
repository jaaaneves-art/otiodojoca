"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CulturaFilterProps {
  categorias: Array<{ id: number; name: string }>;
  onFilterChange: (filters: {
    searchTerm: string;
    tipo_cultura: string[];
    category_id: number[];
    aptidao: string;
    produto: string;
  }) => void;
}

export function CulturaFilter({
  categorias,
  onFilterChange,
}: CulturaFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number[]>([]);
  const [aptidao, setAptidao] = useState("");
  const [produto, setProduto] = useState("");

  const tipos = ["Anual", "Perene", "Arbórea", "Arbustiva"];

  const tipoColors: Record<string, string> = {
    Anual: "bg-yellow-100 hover:bg-yellow-200",
    Perene: "bg-green-100 hover:bg-green-200",
    Arbórea: "bg-blue-100 hover:bg-blue-200",
    Arbustiva: "bg-purple-100 hover:bg-purple-200",
  };

  const handleTipoToggle = (tipo: string) => {
    const novoTipo = tipoSelecionado.includes(tipo)
      ? tipoSelecionado.filter((t) => t !== tipo)
      : [...tipoSelecionado, tipo];

    setTipoSelecionado(novoTipo);
    onFilterChange({
      searchTerm,
      tipo_cultura: novoTipo,
      category_id: categoriaSelecionada,
      aptidao,
      produto,
    });
  };

  const handleCategoriaToggle = (categoryId: number) => {
    const novaCategoria = categoriaSelecionada.includes(categoryId)
      ? categoriaSelecionada.filter((c) => c !== categoryId)
      : [...categoriaSelecionada, categoryId];

    setCategoriaSelecionada(novaCategoria);
    onFilterChange({
      searchTerm,
      tipo_cultura: tipoSelecionado,
      category_id: novaCategoria,
      aptidao,
      produto,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({
      searchTerm: value,
      tipo_cultura: tipoSelecionado,
      category_id: categoriaSelecionada,
      aptidao,
      produto,
    });
  };

  const handleAptidaoChange = (value: string) => {
    setAptidao(value);
    onFilterChange({
      searchTerm,
      tipo_cultura: tipoSelecionado,
      category_id: categoriaSelecionada,
      aptidao: value,
      produto,
    });
  };

  const handleProdutoChange = (value: string) => {
    setProduto(value);
    onFilterChange({
      searchTerm,
      tipo_cultura: tipoSelecionado,
      category_id: categoriaSelecionada,
      aptidao,
      produto: value,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTipoSelecionado([]);
    setCategoriaSelecionada([]);
    setAptidao("");
    setProduto("");
    onFilterChange({
      searchTerm: "",
      tipo_cultura: [],
      category_id: [],
      aptidao: "",
      produto: "",
    });
  };

  const hasActiveFilters =
    searchTerm ||
    tipoSelecionado.length > 0 ||
    categoriaSelecionada.length > 0 ||
    aptidao ||
    produto;

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-6 space-y-6">
      <div>
        <h2 className="font-bold text-lg text-terra-900 mb-4">Filtros</h2>

        {/* Search */}
        <div className="mb-6">
          <label className="text-sm font-medium text-terra-700 block mb-2">
            Procurar Cultura
          </label>
          <Input
            placeholder="Maçã, Lavanda, Trigo..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Tipo de Cultura */}
        <div className="mb-6">
          <label className="text-sm font-medium text-terra-700 block mb-3">
            Tipo de Cultura
          </label>
          <div className="space-y-2">
            {tipos.map((tipo) => (
              <button
                key={tipo}
                onClick={() => handleTipoToggle(tipo)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  tipoSelecionado.includes(tipo)
                    ? `${tipoColors[tipo]} border-2 border-terra-500`
                    : `${tipoColors[tipo]} border border-terra-200`
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Categoria */}
        <div className="mb-6">
          <label className="text-sm font-medium text-terra-700 block mb-3">
            Categoria
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoriaToggle(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                  categoriaSelecionada.includes(cat.id)
                    ? "bg-terra-100 border-2 border-terra-500"
                    : "bg-terra-50 border border-terra-200 hover:bg-terra-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Aptidão */}
        <div className="mb-6">
          <label className="text-sm font-medium text-terra-700 block mb-2">
            Procurar Aptidão
          </label>
          <Input
            placeholder="Aromática, Medicinal, Florestal..."
            value={aptidao}
            onChange={(e) => handleAptidaoChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Produto */}
        <div className="mb-6">
          <label className="text-sm font-medium text-terra-700 block mb-2">
            Procurar Produto
          </label>
          <Input
            placeholder="Madeira, Fruto, Flor seca..."
            value={produto}
            onChange={(e) => handleProdutoChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
