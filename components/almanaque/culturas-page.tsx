"use client";

import { useState, useEffect } from "react";
import { CulturaFilter } from "./cultura-filter";
import { CulturasList } from "./cultura-list";
import { Button } from "@/components/ui/button";

interface CulturaPageProps {
  culturas: Array<{
    id: string;
    nome: string;
    categoria: string;
    descricao_cientifico?: string;
    tipo_cultura: string;
    aptidoes: Array<{
      aptidao: string;
      peso_importancia: number;
    }>;
    produtos: Array<{
      produto_nome: string;
      parte_usada?: string;
      peso_importancia: number;
    }>;
  }>;
  categorias: Array<{
    id: number;
    name: string;
  }>;
}

function anotarCategoryId<T extends { categoria: string }>(
  items: T[],
  categorias: Array<{ id: number; name: string }>
): Array<T & { category_id: number }> {
  const porNome = new Map(categorias.map((c) => [c.name, c.id]));
  return items.map((item) => ({ ...item, category_id: porNome.get(item.categoria) ?? -1 }));
}

type SortOption = "nome" | "tipo" | "aptidoes";

export function CulturasPage({ culturas, categorias }: CulturaPageProps) {
  const [filters, setFilters] = useState({
    searchTerm: "",
    tipo_cultura: [] as string[],
    category_id: [] as number[],
    aptidao: "",
    produto: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("nome");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Estatísticas
  const totalCulturas = culturas.length;
  const totalAptidoes = culturas.reduce(
    (acc, c) => acc + c.aptidoes.length,
    0
  );
  const totalProdutos = culturas.reduce((acc, c) => acc + c.produtos.length, 0);
  const tiposDistintos = new Set(culturas.map((c) => c.tipo_cultura)).size;

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-terra-600 to-terra-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Guia de Culturas</h1>
          <p className="text-terra-100">
            Explore as {totalCulturas} culturas disponíveis no Almanaque
          </p>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-terra-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-terra-100 text-sm">Total de Culturas</p>
              <p className="text-3xl font-bold">{totalCulturas}</p>
            </div>
            <div className="bg-terra-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-terra-100 text-sm">Tipos Distintos</p>
              <p className="text-3xl font-bold">{tiposDistintos}</p>
            </div>
            <div className="bg-terra-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-terra-100 text-sm">Aptidões</p>
              <p className="text-3xl font-bold">{totalAptidoes}</p>
            </div>
            <div className="bg-terra-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-terra-100 text-sm">Produtos</p>
              <p className="text-3xl font-bold">{totalProdutos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filtros */}
          <div className="lg:col-span-1">
            <CulturaFilter
              categorias={categorias}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Main - Lista */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 rounded-lg border border-terra-200 text-sm"
                >
                  <option value="nome">Ordenar por Nome</option>
                  <option value="tipo">Ordenar por Tipo</option>
                  <option value="aptidoes">Mais Aptidões</option>
                </select>
              </div>
            </div>

            {/* Lista de Culturas */}
            <CulturasList
              culturas={anotarCategoryId(culturas, categorias)}
              filters={filters}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
