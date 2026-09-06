"use client";

import { useEffect, useRef, useState } from "react";
import type {
  VehicleMakeSuggestion,
  VehicleModelSuggestion,
} from "@/lib/viaturas/vehicle-catalog";

interface VehicleGenerationSuggestion {
  id: number;
  model_id: number;
  name: string;
  year_start: number | null;
  year_end: number | null;
}

interface VehicleVariantSuggestion {
  id: number;
  generation_id: number;
  name: string;
  fuel_type: string | null;
  displacement_cc: number | null;
  power_hp: number | null;
  power_kw: number | null;
  cylinders: number | null;
  transmission: string | null;
  drivetrain: string | null;
}

interface MarcaModeloAutocompleteProps {
  marcaInicial?: string;
  modeloInicial?: string;
  geracaoInicial?: string;
  varianteInicial?: string;
  marcaObrigatoria?: boolean;
  modeloObrigatorio?: boolean;
  onVariantSelect?: (variant: {
    id: number;
    generation_id: number;
    name: string;
    fuel_type: string | null;
    displacement_cc: number | null;
    power_hp: number | null;
    power_kw: number | null;
    cylinders: number | null;
    transmission: string | null;
    drivetrain: string | null;
  }) => void;
}

function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function MarcaModeloAutocomplete({
  marcaInicial = "",
  modeloInicial = "",
  geracaoInicial = "",
  varianteInicial = "",
  marcaObrigatoria = false,
  modeloObrigatorio = false,
  onVariantSelect,
}: MarcaModeloAutocompleteProps) {
  const [marca, setMarca] = useState(marcaInicial);
  const [modelo, setModelo] = useState(modeloInicial);
  const [geracao, setGeracao] = useState(geracaoInicial);
  const [variante, setVariante] = useState(varianteInicial);

  const [marcaId, setMarcaId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [geracaoId, setGeracaoId] = useState("");
  const [varianteId, setVarianteId] = useState("");

  const [marcas, setMarcas] = useState<VehicleMakeSuggestion[]>([]);
  const [modelos, setModelos] = useState<VehicleModelSuggestion[]>([]);
  const [geracoes, setGeracoes] = useState<VehicleGenerationSuggestion[]>([]);
  const [variantes, setVariantes] = useState<VehicleVariantSuggestion[]>([]);

  const [marcaAberta, setMarcaAberta] = useState(false);
  const [modeloAberto, setModeloAberto] = useState(false);
  const [geracaoAberta, setGeracaoAberta] = useState(false);
  const [varianteAberta, setVarianteAberta] = useState(false);

  const [aCarregarMarcas, setACarregarMarcas] = useState(false);
  const [aCarregarModelos, setACarregarModelos] = useState(false);
  const [aCarregarGeracoes, setACarregarGeracoes] = useState(false);
  const [aCarregarVariantes, setACarregarVariantes] = useState(false);

  const marcaRef = useRef<HTMLDivElement>(null);
  const modeloRef = useRef<HTMLDivElement>(null);
  const geracaoRef = useRef<HTMLDivElement>(null);
  const varianteRef = useRef<HTMLDivElement>(null);

  const marcaQ = useDebounced(marca);
  const modeloQ = useDebounced(modelo);
  const geracaoQ = useDebounced(geracao);
  const varianteQ = useDebounced(variante);

  /*
   * MARCAS
   */
  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      setACarregarMarcas(true);

      try {
        const r = await fetch(
          `/api/viaturas/catalogo?kind=makes&q=${encodeURIComponent(marcaQ)}&limit=20`,
          { signal: controller.signal },
        );

        if (!r.ok) return;

        const json = await r.json();
        setMarcas(json.items ?? []);

        if (!marcaId && marcaQ) {
          const exact = (json.items ?? []).find(
            (m: VehicleMakeSuggestion) =>
              m.name.localeCompare(marcaQ, undefined, {
                sensitivity: "base",
              }) === 0,
          );

          if (exact) setMarcaId(String(exact.id));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setACarregarMarcas(false);
      }
    }

    carregar();

    return () => controller.abort();
  }, [marcaQ, marcaId]);

  /*
   * MODELOS
   */
  useEffect(() => {
    if (!marcaId) {
      setModelos([]);
      return;
    }

    const controller = new AbortController();

    async function carregar() {
      setACarregarModelos(true);

      try {
        const r = await fetch(
          `/api/viaturas/catalogo?kind=models&makeId=${marcaId}&q=${encodeURIComponent(modeloQ)}&limit=30`,
          { signal: controller.signal },
        );

        if (!r.ok) return;

        const json = await r.json();
        setModelos(json.items ?? []);

        if (!modeloId && modeloQ) {
          const exact = (json.items ?? []).find(
            (m: VehicleModelSuggestion) =>
              m.name.localeCompare(modeloQ, undefined, {
                sensitivity: "base",
              }) === 0,
          );

          if (exact) setModeloId(String(exact.id));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setACarregarModelos(false);
      }
    }

    carregar();

    return () => controller.abort();
  }, [marcaId, modeloQ, modeloId]);

  /*
   * GERAÇÕES
   */
  useEffect(() => {
    if (!modeloId) {
      setGeracoes([]);
      return;
    }

    const controller = new AbortController();

    async function carregar() {
      setACarregarGeracoes(true);

      try {
        const r = await fetch(
          `/api/viaturas/catalogo?kind=generations&modelId=${modeloId}&q=${encodeURIComponent(geracaoQ)}&limit=50`,
          { signal: controller.signal },
        );

        if (!r.ok) return;

        const json = await r.json();
        setGeracoes(json.items ?? []);

        if (!geracaoId && geracaoQ) {
          const exact = (json.items ?? []).find(
            (g: VehicleGenerationSuggestion) =>
              g.name.localeCompare(geracaoQ, undefined, {
                sensitivity: "base",
              }) === 0,
          );

          if (exact) setGeracaoId(String(exact.id));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setACarregarGeracoes(false);
      }
    }

    carregar();

    return () => controller.abort();
  }, [modeloId, geracaoQ, geracaoId]);

  /*
   * VARIANTES
   */
  useEffect(() => {
    if (!geracaoId) {
      setVariantes([]);
      return;
    }

    const controller = new AbortController();

    async function carregar() {
      setACarregarVariantes(true);

      try {
        const r = await fetch(
          `/api/viaturas/catalogo?kind=variants&generationId=${geracaoId}&q=${encodeURIComponent(varianteQ)}&limit=50`,
          { signal: controller.signal },
        );

        if (!r.ok) return;

        const json = await r.json();
        setVariantes(json.items ?? []);

        if (!varianteId && varianteQ) {
          const exact = (json.items ?? []).find(
            (v: VehicleVariantSuggestion) =>
              v.name.localeCompare(varianteQ, undefined, {
                sensitivity: "base",
              }) === 0,
          );

          if (exact) setVarianteId(String(exact.id));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setACarregarVariantes(false);
      }
    }

    carregar();

    return () => controller.abort();
  }, [geracaoId, varianteQ, varianteId]);

  /*
   * FECHAR LISTAS AO CLICAR FORA
   */
  useEffect(() => {
    function clickFora(event: MouseEvent) {
      const target = event.target as Node;

      if (marcaRef.current && !marcaRef.current.contains(target)) {
        setMarcaAberta(false);
      }

      if (modeloRef.current && !modeloRef.current.contains(target)) {
        setModeloAberto(false);
      }

      if (geracaoRef.current && !geracaoRef.current.contains(target)) {
        setGeracaoAberta(false);
      }

      if (varianteRef.current && !varianteRef.current.contains(target)) {
        setVarianteAberta(false);
      }
    }

    document.addEventListener("mousedown", clickFora);

    return () => document.removeEventListener("mousedown", clickFora);
  }, []);

  const selecionarMarca = (m: VehicleMakeSuggestion) => {
    setMarca(m.name);
    setMarcaId(String(m.id));

    setModelo("");
    setModeloId("");

    setGeracao("");
    setGeracaoId("");

    setVariante("");
    setVarianteId("");

    setMarcaAberta(false);
    setModeloAberto(false);
    setGeracaoAberta(false);
    setVarianteAberta(false);
  };

  const selecionarModelo = (m: VehicleModelSuggestion) => {
    setModelo(m.name);
    setModeloId(String(m.id));

    setGeracao("");
    setGeracaoId("");

    setVariante("");
    setVarianteId("");

    setModeloAberto(false);
    setGeracaoAberta(false);
    setVarianteAberta(false);
  };

  const selecionarGeracao = (g: VehicleGenerationSuggestion) => {
    setGeracao(g.name);
    setGeracaoId(String(g.id));

    setVariante("");
    setVarianteId("");

    setGeracaoAberta(false);
    setVarianteAberta(false);
  };

  const selecionarVariante = (v: VehicleVariantSuggestion) => {
    setVariante(v.name);
    setVarianteId(String(v.id));
    setVarianteAberta(false);
    onVariantSelect?.(v);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <input type="hidden" name="vehicleMakeId" value={marcaId} />
      <input type="hidden" name="vehicleModelId" value={modeloId} />
      <input type="hidden" name="vehicleGenerationId" value={geracaoId} />
      <input type="hidden" name="vehicleVariantId" value={varianteId} />

      {/* MARCA */}
      <div ref={marcaRef} className="relative">
        <label className="text-sm font-medium">
          Marca{marcaObrigatoria && " *"}
        </label>

        <input
          type="text"
          name="marca"
          value={marca}
          onChange={(e) => {
            setMarca(e.target.value);
            setMarcaId("");

            setModelo("");
            setModeloId("");

            setGeracao("");
            setGeracaoId("");

            setVariante("");
            setVarianteId("");

            setMarcaAberta(true);
          }}
          onFocus={() => setMarcaAberta(true)}
          placeholder="Ex: BMW, BYD, Toyota..."
          required={marcaObrigatoria}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1"
          aria-autocomplete="list"
        />

        {marcaAberta && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {aCarregarMarcas && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                A procurar marcas…
              </div>
            )}

            {!aCarregarMarcas && marcas.length === 0 && marca.trim() && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                Marca não encontrada no catálogo. Podes continuar a escrevê-la
                manualmente.
              </div>
            )}

            {marcas.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selecionarMarca(m)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                <span className="font-medium">{m.name}</span>

                {!!m.aliases?.length && (
                  <span className="ml-2 text-xs text-viaturas-500">
                    {m.aliases.slice(0, 3).join(" · ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODELO */}
      <div ref={modeloRef} className="relative">
        <label className="text-sm font-medium">
          Modelo{modeloObrigatorio && " *"}
        </label>

        <input
          type="text"
          name="modelo"
          value={modelo}
          onChange={(e) => {
            setModelo(e.target.value);
            setModeloId("");

            setGeracao("");
            setGeracaoId("");

            setVariante("");
            setVarianteId("");

            setModeloAberto(true);
          }}
          onFocus={() => {
            if (marcaId) setModeloAberto(true);
          }}
          placeholder={
            marcaId
              ? "Ex: 3 Series, Golf, Clio..."
              : "Escolhe primeiro a marca"
          }
          required={modeloObrigatorio}
          disabled={!marcaId}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1 disabled:bg-gray-50"
          aria-autocomplete="list"
        />

        {modeloAberto && marcaId && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {aCarregarModelos && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                A procurar modelos…
              </div>
            )}

            {!aCarregarModelos && modelos.length === 0 && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                Modelo não encontrado no catálogo. Podes continuar a escrevê-lo
                manualmente.
              </div>
            )}

            {modelos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selecionarModelo(m)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                <span className="font-medium">{m.name}</span>

                {(m.year_start || m.year_end) && (
                  <span className="ml-2 text-xs text-viaturas-500">
                    {m.year_start ?? "?"}–{m.year_end ?? "atual"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GERAÇÃO */}
      <div ref={geracaoRef} className="relative">
        <label className="text-sm font-medium">Geração / Carroçaria</label>

        <input
          type="text"
          name="geracao"
          value={geracao}
          onChange={(e) => {
            setGeracao(e.target.value);
            setGeracaoId("");

            setVariante("");
            setVarianteId("");

            setGeracaoAberta(true);
          }}
          onFocus={() => {
            if (modeloId) setGeracaoAberta(true);
          }}
          placeholder={
            modeloId
              ? "Escolhe a geração / carroçaria"
              : "Escolhe primeiro o modelo"
          }
          disabled={!modeloId}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1 disabled:bg-gray-50"
          aria-autocomplete="list"
        />

        {geracaoAberta && modeloId && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {aCarregarGeracoes && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                A procurar gerações…
              </div>
            )}

            {!aCarregarGeracoes && geracoes.length === 0 && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                Não existem gerações conhecidas para este modelo. Podes
                continuar a preencher manualmente.
              </div>
            )}

            {geracoes.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selecionarGeracao(g)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                <span className="font-medium">{g.name}</span>

                {(g.year_start || g.year_end) && (
                  <span className="ml-2 text-xs text-viaturas-500">
                    {g.year_start ?? "?"}–{g.year_end ?? "atual"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VARIANTE */}
      <div ref={varianteRef} className="relative">
        <label className="text-sm font-medium">Versão / Motorização</label>

        <input
          type="text"
          name="variante"
          value={variante}
          onChange={(e) => {
            setVariante(e.target.value);
            setVarianteId("");
            setVarianteAberta(true);
          }}
          onFocus={() => {
            if (geracaoId) setVarianteAberta(true);
          }}
          placeholder={
            geracaoId
              ? "Ex: 320d, 330i, 318i..."
              : "Escolhe primeiro a geração"
          }
          disabled={!geracaoId}
          autoComplete="off"
          className="w-full border rounded-lg p-2 mt-1 disabled:bg-gray-50"
          aria-autocomplete="list"
        />

        {varianteAberta && geracaoId && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-viaturas-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {aCarregarVariantes && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                A procurar versões…
              </div>
            )}

            {!aCarregarVariantes && variantes.length === 0 && (
              <div className="px-4 py-2 text-sm text-viaturas-500">
                Não existem versões conhecidas para esta geração. Podes
                continuar a preencher manualmente.
              </div>
            )}

            {variantes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => selecionarVariante(v)}
                className="w-full text-left px-4 py-2 hover:bg-viaturas-50 border-b border-viaturas-100 last:border-b-0"
              >
                <div className="font-medium">{v.name}</div>

                <div className="text-xs text-viaturas-500 mt-0.5">
                  {[
                    v.fuel_type,
                    v.displacement_cc
                      ? `${v.displacement_cc} cc`
                      : null,
                    v.power_hp ? `${v.power_hp} HP` : null,
                    v.transmission,
                    v.drivetrain,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
