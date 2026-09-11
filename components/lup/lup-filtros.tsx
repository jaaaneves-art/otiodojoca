"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LUP_AD_TYPES } from "@/lib/lup/ad-types";
import { Leaf, PawPrint, Recycle, Salad, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

interface Categoria { id: number; name: string; slug: string; }

interface FiltrosProps {
  categories: Categoria[];
}

const CATEGORIA_ICON: Record<string, typeof Leaf> = {
  "lup-humano": Salad,
  "lup-animal": PawPrint,
  "lup-compostagem": Leaf,
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
    <div className="mb-8">
      <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-lup-950 px-5 py-10 shadow-[0_24px_60px_rgba(8,47,29,0.2)] sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[42px] border-lup-700/40" />
        <div className="absolute -bottom-20 left-[12%] h-40 w-40 rounded-full bg-lup-500/15 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lup-600/70 bg-lup-800/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lup-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Partilhar faz bem
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl">
            O que sobra a alguém <span className="text-lup-300">pode servir a outro.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-lup-100 sm:text-base">
            Dá uma nova volta a alimentos e recursos locais — para pessoas, animais ou compostagem.
          </p>
          <form onSubmit={applyFilters} className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
            <label className="flex min-h-12 flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-lup-600" />
              <span className="sr-only">Pesquisar no LUP</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="O que procuras perto de ti?"
                className="min-w-0 flex-1 border-0 bg-transparent text-lup-950 outline-none placeholder:text-lup-700/60"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-xl bg-lup-600 px-6 text-sm font-black text-white transition hover:bg-lup-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lup-400 focus-visible:ring-offset-2">
              Procurar
            </button>
          </form>
        </div>
      </section>

      {/* Tabs de ciclo (categoria) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => selectCategory("")}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
            activeCategory === ""
              ? "border-lup-700 bg-lup-700 text-white shadow-md shadow-lup-800/10"
              : "border-lup-200 bg-white text-lup-800 hover:border-lup-400 hover:bg-lup-50"
          }`}
        >
          <Recycle className="h-4 w-4" /> Todos os ciclos
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORIA_ICON[cat.slug] ?? Leaf;
          return (
            <button
              key={cat.id}
              onClick={() => selectCategory(String(cat.id))}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                activeCategory === String(cat.id)
                  ? "border-lup-700 bg-lup-700 text-white shadow-md shadow-lup-800/10"
                  : "border-lup-200 bg-white text-lup-800 hover:border-lup-400 hover:bg-lup-50"
              }`}
            >
              <Icon className="h-4 w-4" /> {cat.name}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${showFilters ? "border-lup-300 bg-lup-100 text-lup-900" : "border-lup-200 bg-white text-lup-800 hover:border-lup-400"}`}
        >
          <SlidersHorizontal className="h-4 w-4" /> {showFilters ? "Ocultar filtros" : "Mais filtros"}
        </button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <form onSubmit={applyFilters} className="mt-3 rounded-2xl border border-lup-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,74,44,0.06)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-lup-700">Tipo de anúncio</label>
              <select
                value={type}
                onChange={(e) => selectType(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-lup-200 bg-lup-50/50 px-3 text-lup-950 outline-none focus:border-lup-500 focus:ring-2 focus:ring-lup-200"
              >
                <option value="">Todos</option>
                {Object.values(LUP_AD_TYPES).map((t) => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-lup-700">Ordenar resultados</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-lup-200 bg-lup-50/50 px-3 text-lup-950 outline-none focus:border-lup-500 focus:ring-2 focus:ring-lup-200"
              >
                <option value="recentes">Mais recentes</option>
                <option value="recolha">Recolha mais próxima</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" className="min-h-11 rounded-xl bg-lup-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-lup-800">
              Aplicar
            </button>
            {(hasAdvancedFilters || query) && (
              <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50">
                <X className="h-4 w-4" /> Limpar filtros
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
