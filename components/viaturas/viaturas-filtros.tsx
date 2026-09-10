"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BadgeEuro,
  Car,
  CircleDollarSign,
  Gauge,
  Gavel,
  Handshake,
  KeyRound,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COMBUSTIVEL_OPCOES, CAIXA_OPCOES } from "@/lib/viaturas/ad-types";
import { VehicleMakeFilter } from "@/components/viaturas/vehicle-make-filter";

interface Categoria { id: number; name: string; }

interface FiltrosProps {
  categories: Categoria[];
}

const MODOS = [
  { value: "", label: "Todos", icon: Car },
  { value: "venda", label: "À venda", icon: CircleDollarSign },
  { value: "alugar", label: "Alugar", icon: KeyRound },
  { value: "ceder", label: "Ceder", icon: Handshake },
  { value: "comprar", label: "Procuro comprar", icon: Search },
];

// Atalhos de um clique para os filtros mais pedidos — inspirado nos chips
// rápidos do AutoNex (ver docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md).
// Cada chip só define os parâmetros que lhe dizem respeito; os outros
// filtros já ativos mantêm-se.
const CHIPS: Array<{ label: string; icon: LucideIcon; overrides: Record<string, string> }> = [
  { label: "Elétrico", icon: Zap, overrides: { combustivel: "Elétrico" } },
  { label: "Híbrido", icon: Sparkles, overrides: { combustivel: "Híbrido" } },
  { label: "Automática", icon: Gauge, overrides: { caixa: "Automática" } },
  { label: "Até 50.000 km", icon: Gauge, overrides: { kmMax: "50000" } },
  { label: "Até 10.000 €", icon: BadgeEuro, overrides: { max: "10000" } },
];

export default function ViaturasFiltros({ categories }: FiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [marca, setMarca] = useState(searchParams.get("marca") ?? "");
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
      q: query, marca, category, min: minPrice, max: maxPrice,
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
    setQuery(""); setMarca(""); setCategory(""); setMinPrice(""); setMaxPrice("");
    setAnoMin(""); setKmMax(""); setCombustivel(""); setCaixa(""); setSort("recentes");
    router.push("/viaturas");
  };

  // Chip aplica-se por cima dos filtros já ativos: atualiza só o(s) campo(s)
  // que lhe dizem respeito no estado local (para o painel avançado refletir
  // a escolha) e navega logo, sem esperar por "Aplicar".
  const applyChip = (overrides: Record<string, string>) => {
    if (overrides.combustivel !== undefined) setCombustivel(overrides.combustivel);
    if (overrides.caixa !== undefined) setCaixa(overrides.caixa);
    if (overrides.kmMax !== undefined) setKmMax(overrides.kmMax);
    if (overrides.max !== undefined) setMaxPrice(overrides.max);
    const qs = buildParams(overrides);
    router.push(`/viaturas${qs ? "?" + qs : ""}`);
  };

  const isChipActive = (overrides: Record<string, string>) =>
    Object.entries(overrides).every(([key, val]) => searchParams.get(key) === val);

  const hasAdvancedFilters = marca || category || minPrice || maxPrice || anoMin || kmMax || combustivel || caixa || (sort && sort !== "recentes");

  return (
    <div className="relative">
      {/* Hero + pesquisa */}
      <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-10 text-white shadow-2xl shadow-slate-950/15 sm:px-9 sm:py-12 lg:px-12">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#b7f34a]/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#b7f34a]">
            <Sparkles size={14} aria-hidden="true" /> Marketplace automóvel português
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-[.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
            A próxima estrada começa aqui.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Compra, vende, aluga, cede ou encontra a viatura certa numa comunidade próxima e transparente.
          </p>
        </div>

        <form onSubmit={applyFilters} className="relative mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Pesquisar por marca ou modelo</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Marca, modelo ou palavra-chave"
              className="h-12 w-full rounded-xl border-0 bg-slate-50 pl-12 pr-4 text-base text-slate-950 outline-none ring-blue-500 transition placeholder:text-slate-400 focus:ring-2"
            />
          </label>
          <button type="submit" className="h-12 rounded-xl bg-blue-600 px-7 font-extrabold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            Pesquisar viaturas
          </button>
        </form>

        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
          <span>✓ Publicação simples</span><span>✓ Contacto privado</span><span>✓ Stands verificados</span>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">Explorar</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Como queres avançar?</h2>
        </div>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition ${showFilters ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`} aria-expanded={showFilters}>
          <SlidersHorizontal size={17} aria-hidden="true" />
          <span className="hidden sm:inline">{showFilters ? "Fechar filtros" : "Mais filtros"}</span>
          <span className="sm:hidden">Filtros</span>
        </button>
      </div>

      {/* Tabs de modo */}
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODOS.map((modo) => {
          const Icon = modo.icon;
          return <button key={modo.value} type="button" onClick={() => selectModo(modo.value)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${activeType === modo.value ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"}`}>
            <Icon size={17} aria-hidden="true" /> {modo.label}
          </button>;
        })}
        <Link href="/viaturas/leiloes" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:border-amber-400">
          <Gavel size={17} aria-hidden="true" /> Leilões
        </Link>
      </div>

      {/* Chips rápidos */}
      <div className="mb-7 flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const active = isChipActive(chip.overrides);
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => applyChip(active ? Object.fromEntries(Object.keys(chip.overrides).map((k) => [k, ""])) : chip.overrides)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
            >
              <Icon size={14} aria-hidden="true" /> {chip.label}
            </button>
          );
        })}
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <form onSubmit={applyFilters} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><p className="text-sm font-black text-slate-950">Afinar pesquisa</p><p className="mt-1 text-xs text-slate-500">Combina os filtros para encontrares a opção certa.</p></div>
            <button type="button" onClick={() => setShowFilters(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar filtros"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium text-viaturas-800">Marca</label>
              <VehicleMakeFilter
                value={marca}
                onChange={setMarca}
              />
            </div>

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

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            {(hasAdvancedFilters || query) && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                <X size={16} aria-hidden="true" /> Limpar filtros
              </button>
            )}
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500">
              Mostrar resultados
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
