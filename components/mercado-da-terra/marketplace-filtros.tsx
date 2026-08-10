"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Categoria { id: number; name: string; }
interface Municipio { nome: string; distrito_regiao: string; }

interface FiltrosProps {
  categories: Categoria[];
  municipios: Municipio[];
}

export default function MarketplaceFiltros({ categories, municipios }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");

  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (type) params.set("type", type);

    const queryString = params.toString();
    router.push(`/mercado-da-terra${queryString ? "?" + queryString : ""}`);
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setType("");
    router.push("/mercado-da-terra");
  };

  const hasActiveFilters = query || category || location || minPrice || maxPrice || type;

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-4 mb-8">
      <form onSubmit={applyFilters}>
        {/* Barra de Pesquisa */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Pesquisar anúncios..."
            className="flex-1 border border-terra-200 rounded-lg p-2 focus:outline-none focus:border-terra-600"
          />
          <button
            type="submit"
            className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700"
          >
            Pesquisar
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50"
          >
            {showFilters ? "▲ Filtros" : "▼ Filtros"}
          </button>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-terra-200">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-terra-700">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-terra-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todos</option>
                <option value="sale">💰 Venda</option>
                <option value="offer">🎁 Oferta</option>
                <option value="troca">🔍 Procura</option>
                <option value="procura">🔄 Troca</option>
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm font-medium text-terra-700">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-terra-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Localidade */}
            <div>
              <label className="text-sm font-medium text-terra-700">Localidade</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-terra-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todas</option>
                {municipios.map((m) => (
                  <option key={m.nome} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>

            {/* Preço Min */}
            <div>
              <label className="text-sm font-medium text-terra-700">Preço mínimo (€)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border border-terra-200 rounded-lg p-2 mt-1"
              />
            </div>

            {/* Preço Max */}
            <div>
              <label className="text-sm font-medium text-terra-700">Preço máximo (€)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                min="0"
                step="0.01"
                className="w-full border border-terra-200 rounded-lg p-2 mt-1"
              />
            </div>

            {/* Botão Limpar */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full border border-red-200 text-red-600 font-medium py-2 px-4 rounded-lg hover:bg-red-50"
                >
                  ✕ Limpar Filtros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtros Ativos (Chips) */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-terra-200">
            {query && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">🔍 {query}</span>}
            {type && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">Tipo: {type}</span>}
            {category && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">Categoria: {categories.find(c => c.id.toString() === category)?.name}</span>}
            {location && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">📍 {location}</span>}
            {minPrice && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">Min: €{minPrice}</span>}
            {maxPrice && <span className="bg-terra-100 text-terra-700 text-xs px-3 py-1 rounded-full">Max: €{maxPrice}</span>}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-800 ml-2"
            >
              ✕ Limpar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
