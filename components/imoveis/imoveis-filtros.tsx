"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Categoria { id: number; name: string; }

interface FiltrosProps {
  categories: Categoria[];
}

const MODOS = [
  { value: "", label: "Todos", icon: "🏠" },
  { value: "venda", label: "Venda", icon: "💰" },
  { value: "arrendamento", label: "Arrendamento", icon: "🔑" },
  { value: "quarto", label: "Quarto", icon: "🛏️" },
  { value: "permuta", label: "Permuta", icon: "🔄" },
  { value: "companhia", label: "Troca por companhia", icon: "🤝" },
  { value: "leilao", label: "Leilão", icon: "🔨" },
];

export default function ImoveisFiltros({ categories }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("quartos") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recentes");
  const [paraEstudantes, setParaEstudantes] = useState(searchParams.get("estudantes") === "1");
  const [showFilters, setShowFilters] = useState(false);

  const activeType = searchParams.get("type") ?? "";

  const buildParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      q: query, category, min: minPrice, max: maxPrice, quartos: bedrooms, sort, type: activeType,
      estudantes: paraEstudantes ? "1" : "",
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
    router.push(`/imoveis${qs ? "?" + qs : ""}`);
  };

  const selectModo = (value: string) => {
    const qs = buildParams({ type: value });
    router.push(`/imoveis${qs ? "?" + qs : ""}`);
  };

  const clearFilters = () => {
    setQuery(""); setCategory(""); setMinPrice(""); setMaxPrice(""); setBedrooms(""); setSort("recentes"); setParaEstudantes(false);
    router.push("/imoveis");
  };

  const hasAdvancedFilters = category || minPrice || maxPrice || bedrooms || paraEstudantes || (sort && sort !== "recentes");

  return (
    <div>
      {/* Hero + pesquisa */}
      <div className="bg-imoveis-900 rounded-2xl p-8 mb-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-1">IMÓVEIS</h2>
        <p className="text-imoveis-100 mb-6">Compra, vende, arrenda um quarto, permuta ou troca por companhia.</p>
        <form onSubmit={applyFilters} className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 O que procuras? Ex: apartamento em Lisboa"
            className="flex-1 rounded-lg p-3 border-0 focus:outline-none focus:ring-2 focus:ring-imoveis-400"
          />
          <button
            type="submit"
            className="bg-imoveis-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-imoveis-700"
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
                ? "bg-imoveis-600 border-imoveis-600 text-white"
                : "border-imoveis-200 text-imoveis-800 hover:bg-imoveis-50"
            }`}
          >
            {modo.icon} {modo.label}
          </button>
        ))}
        <Link href="/imoveis/leiloes">
          <button className="font-medium py-2 px-4 rounded-full border border-imoveis-200 text-imoveis-800 hover:bg-imoveis-50">
            🔨 Leilões
          </button>
        </Link>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto text-sm text-imoveis-700 hover:text-imoveis-900 underline"
        >
          {showFilters ? "▲ Menos filtros" : "▼ Mais filtros"}
        </button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <form onSubmit={applyFilters} className="bg-white rounded-lg border border-imoveis-200 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-sm font-medium text-imoveis-800">Tipo de imóvel</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-imoveis-200 rounded-lg p-2 mt-1"
              >
                <option value="">Todos</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-imoveis-800">Preço mínimo (€)</label>
              <input
                type="number" min="0" step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-imoveis-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-imoveis-800">Preço máximo (€)</label>
              <input
                type="number" min="0" step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                className="w-full border border-imoveis-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-imoveis-800">Quartos (mín.)</label>
              <input
                type="number" min="0" step="1"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="0"
                className="w-full border border-imoveis-200 rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-imoveis-800">Ordenar</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-imoveis-200 rounded-lg p-2 mt-1"
              >
                <option value="recentes">Mais recentes</option>
                <option value="preco-asc">Mais baratos</option>
                <option value="preco-desc">Mais caros</option>
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-imoveis-800">
                <input
                  type="checkbox"
                  checked={paraEstudantes}
                  onChange={(e) => setParaEstudantes(e.target.checked)}
                />
                🎓 Só para estudantes
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-imoveis-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-imoveis-700">
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
