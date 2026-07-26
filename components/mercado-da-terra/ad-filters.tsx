"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface FilterOptions {
  search: string;
  category: string;
  priceMin: string;
  priceMax: string;
  municipality: string;
  priceType: string;
  status: string;
  sortBy: string;
}

interface AdFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  categories?: string[];
  municipalities?: string[];
  isLoading?: boolean;
}

const PRICE_TYPES = [
  { value: "", label: "Qualquer tipo" },
  { value: "fixed", label: "Preço fixo" },
  { value: "negotiable", label: "Negociável" },
  { value: "free", label: "Grátis" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "price-low", label: "Preço: menor" },
  { value: "price-high", label: "Preço: maior" },
  { value: "views", label: "Mais visualizados" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "reserved", label: "Reservados" },
  { value: "sold", label: "Vendidos" },
];

export function AdFilters({
  onFiltersChange,
  categories = [],
  municipalities = [],
  isLoading = false,
}: AdFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "",
    priceMin: "",
    priceMax: "",
    municipality: "",
    priceType: "",
    status: "active",
    sortBy: "newest",
  });

  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: "",
      category: "",
      priceMin: "",
      priceMax: "",
      municipality: "",
      priceType: "",
      status: "active",
      sortBy: "newest",
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.priceMin ||
    filters.priceMax ||
    filters.municipality ||
    filters.priceType;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Filtros e Busca
          </CardTitle>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-terra-600 hover:text-terra-800 text-sm font-medium"
          >
            {expanded ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Busca por texto */}
          <div>
            <label className="text-sm font-medium text-terra-700">Busca</label>
            <Input
              type="text"
              placeholder="Procura por título ou descrição..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          {/* Grade de filtros 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="text-sm font-medium text-terra-700">Categoria</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-terra-200 text-sm"
                disabled={isLoading}
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Localização */}
            <div>
              <label className="text-sm font-medium text-terra-700">Localização</label>
              <select
                value={filters.municipality}
                onChange={(e) => handleFilterChange("municipality", e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-terra-200 text-sm"
                disabled={isLoading}
              >
                <option value="">Todos os concelhos</option>
                {municipalities.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Preço */}
            <div>
              <label className="text-sm font-medium text-terra-700">Tipo de Preço</label>
              <select
                value={filters.priceType}
                onChange={(e) => handleFilterChange("priceType", e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-terra-200 text-sm"
                disabled={isLoading}
              >
                {PRICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-terra-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-terra-200 text-sm"
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intervalo de Preço */}
          <div className="border-t border-terra-200 pt-4">
            <label className="text-sm font-medium text-terra-700 block mb-3">
              Intervalo de Preço (€)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                disabled={isLoading}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Ordenação */}
          <div className="border-t border-terra-200 pt-4">
            <label className="text-sm font-medium text-terra-700">Ordenar por</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full mt-2 p-2 rounded-lg border border-terra-200 text-sm"
              disabled={isLoading}
            >
              {SORT_OPTIONS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 border-t border-terra-200 pt-4">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
                disabled={isLoading}
              >
                <X size={16} className="mr-2" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
