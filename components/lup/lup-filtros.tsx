"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LUP_AD_TYPES } from "@/lib/lup/ad-types";

interface Categoria { id: number; name: string; slug: string; }

interface FiltrosProps {
  categories: Categoria[];
}

const CATEGORIA_ICON: Record<string, string> = {
  "lup-humano": "🥗",
  "lup-animal": "🐾",
  "lup-compostagem": "🌱",
};

export default function LupFiltros({ categories }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recentes");
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";

  const buildParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      q: query, category: activeCategory, type, sort,
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
    router.push(`/lup${qs ? "?" + qs : ""}`);
  };

  const selectCategory = (categoryId: string) => {
    const qs = buildParams({ category: categoryId });
    router.push(`/lup${qs ? "?" + qs : ""}`);
  };

  const selectType = (value: string) => {
    setType(value);
    const qs = buildParams({ type: value });
    router.push(`/lup${qs ? "?" + qs : ""}`);
  };

  const clearFilters = () => {
    setQuery(""); setType(""); setSort("recentes");
    router.push("/lup");
  };

  const hasAdvancedFilters = type || (sort && sort !== "recentes");

  return (
    <div>
      {/* Hero + pesquisa */}
      <div className="bg-lup-900 rounded-2xl p-8 mb-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-1">LUP</h2>
        <p className="text-lup-100 mb-6">Zero desperdício. Três ciclos: humano, animal, compostagem.</p>
        <form onSubmit={applyFilters} className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 O que procuras?"
            className="flex-1 rounded-lg p-3 border-0 focus:outline-none focus:ring-2 focus:ring-lup-400"
          />
          <button
            type="submit"
            className="bg-lup-500 text-white font-medium py-3 px-6 rounded-lg hover:bg-lup-600"
          >
            Procurar
          </button>
        </form>
      </div>

      {/* Tabs de ciclo (categoria) */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => selectCategory("")}
          className={`font-medium py-2 px-4 rounded-full border transition ${
            activeCategory === ""
              ? "bg-lup-500 border-lup-500 text-white"
              : "border-lup-200 text-lup-800 hover:bg-lup-50"
          }`}
        >
          ♻️ Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => selectCategory(String(cat.id))}
            className={`font-medium py-2 px-4 rounded-full border transition ${
              activeCategory === String(cat.id)
                ? "bg-lup-500 border-lup-500 text-white"
                : "border-lup-200 text-lup-800 hover:bg-lup-50"
            }`}
          >
            {CATEGORIA_ICON[cat.slug] ?? "📦"} {cat.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto text-sm text-lup-700 hover:text-lup-900 underline"
        >
          {showFilters ? "▲ Menos filtros" : "▼ Mais filtros"}
        </button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <form onSubmit={applyFilters} className="bg-white rounded-lg border border-lup-200 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-lup-800">Tipo</label>
              <select
                value={type}
                onChange={(e) => selectType(e.target.value)}
                className="w-full border border-lup-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todos</option>
                {Object.values(LUP_AD_TYPES).map((t) => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-lup-800">Ordenar</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-lup-200 rounded-lg p-2 mt-1"
              >
                <option value="recentes">Mais recentes</option>
                <option value="recolha">Recolha mais próxima</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-lup-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-lup-600">
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
