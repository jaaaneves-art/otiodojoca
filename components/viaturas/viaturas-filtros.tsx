"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { COMBUSTIVEL_OPCOES, CAIXA_OPCOES } from "@/lib/viaturas/ad-types";

interface Categoria { id: number; name: string; }

interface FiltrosProps {
  categories: Categoria[];
}

const MODOS = [
  { value: "", label: "Todos", icon: "🚗" },
  { value: "venda", label: "À venda", icon: "💰" },
];

export default function ViaturasFiltros({ categories }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");
  const [anoMin, setAnoMin] = useState(searchParams.get("anoMin") ?? "");
  const [kmMax, setKmMax] = useState(searchParams.get("kmMax") ?? "");
  const [combustivel, setCombustivel] = useState(searchParams.get("combustivel") ?? "");
  const [caixa, setCaixa] = useState(searchParams.get("caixa") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recentes");
  const [showFilters, setShowFilters] = useState(false);

  const activeType = searchParams.get("type") ?? "";

  const buildParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      q: query, category, min: minPrice, max: maxPrice,
      anoMin, kmMax, combustivel, caixa, sort, type: activeType,
      ...overrides,
    };
    Object.entries(values).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    return params.toString();
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = buildParams({});
    router.push(`/viaturas${qs ? "?" + qs : ""}`);
  };

  const selectModo = (value: string) => {
    const qs = buildParams({ type: value });
    router.push(`/viaturas${qs ? "?" + qs : ""}`);
  };

  const clearFilters = () => {
    setQuery(""); setCategory(""); setMinPrice(""); setMaxPrice("");
    setAnoMin(""); setKmMax(""); setCombustivel(""); setCaixa(""); setSort("recentes");
    router.push("/viaturas");
  };

  const hasAdvancedFilters = category || minPrice || maxPrice || anoMin || kmMax || combustivel || caixa || (sort && sort !== "recentes");

  return (
    <div>
      {/* Hero + pesquisa */}
      <div className="bg-viaturas-900 rounded-2xl p-8 mb-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-1">🚗 STANDGO</h2>
        <p className="text-viaturas-100 mb-6">Compra e vende viaturas — à venda ou em leilão</p>
        <form onSubmit={applyFilters} className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 Marca, modelo..."
            className="flex-1 rounded-lg p-3 border-0 focus:outline-none focus:ring-2 focus:ring-viaturas-400"
          />
          <button
            type="submit"
            className="bg-viaturas-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-viaturas-700"
          >
            Procurar
          </button>
        </form>
      </div>

      {/* Tabs de modo */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODOS.map((modo) => (
          <button
            key={modo.value}
            onClick={() => selectModo(modo.value)}
            className={`font-medium py-2 px-4 rounded-full border transition ${
              activeType === modo.value
                ? "bg-viaturas-600 border-viaturas-600 text-white"
                : "border-viaturas-200 text-viaturas-800 hover:bg-viaturas-50"
            }`}
          >
            {modo.icon} {modo.label}
          </button>
        ))}
        <Link href="/viaturas/leiloes">
          <button className="font-medium py-2 px-4 rounded-full border border-viaturas-200 text-viaturas-800 hover:bg-viaturas-50">
            🔨 Leilões
          </button>
        </Link>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto text-sm text-viaturas-700 hover:text-viaturas-900 underline"
        >
          {showFilters ? "▲ Menos filtros" : "▼ Mais filtros"}
        </button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <form onSubmit={applyFilters} className="bg-white rounded-lg border border-viaturas-200 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium text-viaturas-800">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Combustível</label>
              <select
                value={combustivel}
                onChange={(e) => setCombustivel(e.target.value)}
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todos</option>
                {COMBUSTIVEL_OPCOES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Caixa</label>
              <select
                value={caixa}
                onChange={(e) => setCaixa(e.target.value)}
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todas</option>
                {CAIXA_OPCOES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Ano mínimo</label>
              <input
                type="number" min="1900" max="2100"
                value={anoMin}
                onChange={(e) => setAnoMin(e.target.value)}
                placeholder="2015"
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Km máximo</label>
              <input
                type="number" min="0"
                value={kmMax}
                onChange={(e) => setKmMax(e.target.value)}
                placeholder="150000"
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Preço mínimo (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Preço máximo (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-viaturas-800">Ordenar</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
              >
                <option value="recentes">Mais recentes</option>
                <option value="preco-asc">Mais baratos</option>
                <option value="preco-desc">Mais caros</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-viaturas-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-viaturas-700">
              Aplicar
            </button>
            {(hasAdvancedFilters || query) && (
              <button type="button" onClick={clearFilters} className="border border-red-200 text-red-600 font-medium py-2 px-4 rounded-lg hover:bg-red-50">
                ✕ Limpar filtros
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
