#!/usr/bin/env node
/**
 * Sincroniza catálogo automóvel global para Supabase.
 *
 * Fontes:
 *   1. VehiclesDB (CC-BY 4.0)
 *      - catálogo principal de marcas/modelos.
 *
 *   2. gor3a/vehicle-makes-models (ODbL 1.0)
 *      - complementa modelos das marcas já existentes;
 *      - gerações;
 *      - variantes/motorizações.
 *
 * Estratégia:
 *   - VehiclesDB continua a ser a base principal.
 *   - gor3a nunca cria marcas novas automaticamente.
 *   - Para uma marca já reconhecida, modelos gor3a que ainda não existam
 *     são adicionados ao catálogo.
 *   - Evitamos fuzzy matching agressivo para não ligar modelos errados.
 *   - Gerações e variantes gor3a são regeneradas em cada sincronização.
 *
 * Variáveis:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   node scripts/sync-vehicle-catalog.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "Definir NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar.",
  );
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const VDB_MAKES =
  "https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/catalog/car/makes.json";

const VDB_MODELS =
  "https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/catalog/car/models.json";

const GOR3A =
  "https://raw.githubusercontent.com/gor3a/vehicle-makes-models/refs/heads/main/data/json/all.json";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* -------------------------------------------------------------------------- */
/* Normalização                                                               */
/* -------------------------------------------------------------------------- */

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Forma ainda mais tolerante:
 *
 * "C-Class"      -> "cclass"
 * "C Class"      -> "cclass"
 * "3-Series"     -> "3series"
 * "3 Series"     -> "3series"
 */
function compact(value = "") {
  return normalize(value).replace(/\s+/g, "");
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
}

function nullableInt(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.round(number)
    : null;
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                       */
/* -------------------------------------------------------------------------- */

async function fetchJSON(targetUrl, attempts = 4) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "otiodojoca-vehicle-catalog/2.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText}: ${targetUrl}`,
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(700 * (attempt + 1));
    }
  }

  throw lastError;
}

/* -------------------------------------------------------------------------- */
/* Supabase helpers                                                           */
/* -------------------------------------------------------------------------- */

async function upsertChunk(
  table,
  rows,
  onConflict,
  size = 500,
) {
  if (!rows.length) return;

  for (let index = 0; index < rows.length; index += size) {
    const chunk = rows.slice(index, index + size);

    const { error } = await supabase
      .from(table)
      .upsert(chunk, {
        onConflict,
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    console.log(
      `${table}: ${Math.min(index + size, rows.length)}/${rows.length}`,
    );
  }
}

async function insertChunk(
  table,
  rows,
  size = 300,
) {
  if (!rows.length) return;

  for (let index = 0; index < rows.length; index += size) {
    const chunk = rows.slice(index, index + size);

    const { error } = await supabase
      .from(table)
      .insert(chunk);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    console.log(
      `${table}: ${Math.min(index + size, rows.length)}/${rows.length}`,
    );
  }
}

/**
 * Supabase/PostgREST limita normalmente cada pedido a 1000 linhas.
 * Esta função percorre todas as páginas para que os índices locais
 * contenham o catálogo completo.
 */
async function selectAll(table, columns, pageSize = 1000) {
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  console.log(`${table}: ${rows.length} linhas carregadas para memória`);
  return rows;
}


/* -------------------------------------------------------------------------- */
/* Aliases seguros de marcas                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Só colocamos equivalências de marca inequívocas.
 *
 * A maioria das diferenças já é resolvida por normalize():
 *   Mercedes-Benz -> mercedes benz
 *   Mercedes Benz -> mercedes benz
 */
const GOR3A_MAKE_RULES = {
  "mercedes amg": { target: "Mercedes-Benz" },

  "ac": { create: "AC" },
  "aro": { create: "ARO" },
  "artega": { create: "Artega" },
  "aurus": { create: "Aurus" },
  "bestune": { create: "Bestune" },
  "brilliance": { create: "Brilliance" },
  "bufori": { create: "Bufori" },
  "dmc": { create: "DeLorean", aliases: ["DMC"] },
  "dr": { create: "DR" },
  "el nasr": { create: "El Nasr" },
  "foton": { create: "Foton" },
  "gordon murray automotive": { create: "Gordon Murray Automotive" },
  "gta": { create: "GTA" },
  "hindustan": { create: "Hindustan" },
  "iran khodro": { create: "Iran Khodro" },
  "koenigsegg": { create: "Koenigsegg" },
  "li auto": { create: "Li Auto" },
  "lightyear": { create: "Lightyear" },
  "marussia": { create: "Marussia" },
  "maruti suzuki": { create: "Maruti Suzuki" },
  "moskvitch": { create: "Moskvitch" },
  "panoz": { create: "Panoz" },
  "qoros": { create: "Qoros" },
  "rimac": { create: "Rimac" },
  "saipa": { create: "Saipa" },
  "saleen": { create: "Saleen" },
  "samsung": { create: "Renault Samsung Motors", aliases: ["Samsung"] },
  "santana": { create: "Santana" },
  "scout": { create: "Scout" },
  "speranza": { create: "Speranza" },
  "tank": { create: "Tank" },
  "wiesmann": { create: "Wiesmann" },
  "wuling": { create: "Wuling" },
  "zenvo": { create: "Zenvo" },

  // Zender fica deliberadamente de fora até ser revisto.
};

const SAFE_MAKE_ALIASES = new Map([
  ["vw", "volkswagen"],
  ["volkswagen ag", "volkswagen"],

  ["mercedes", "mercedes benz"],
  ["mercedesbenz", "mercedes benz"],

  ["bmw alpina", "alpina"],

  ["chevy", "chevrolet"],

  ["rolls royce", "rolls royce"],

  ["landrover", "land rover"],

  ["alfaromeo", "alfa romeo"],

  ["astonmartin", "aston martin"],

  ["greatwall", "great wall"],

  ["citroen", "citroen"],
]);

/* -------------------------------------------------------------------------- */
/* 1. Obter as fontes                                                         */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("====================================================");
console.log(" StandGo — sincronização catálogo automóvel");
console.log("====================================================");
console.log("");

console.log("1/7 A descarregar VehiclesDB e gor3a...");

const [vdbMakesRaw, vdbModelsRaw, gor3aRaw] =
  await Promise.all([
    fetchJSON(VDB_MAKES),
    fetchJSON(VDB_MODELS),
    fetchJSON(GOR3A).catch((error) => {
      console.warn(
        "Aviso: gor3a indisponível. Será usado apenas VehiclesDB:",
        error.message,
      );

      return [];
    }),
  ]);

console.log(
  `VehiclesDB: ${vdbMakesRaw.length} marcas / ${vdbModelsRaw.length} modelos`,
);

/* -------------------------------------------------------------------------- */
/* 2. VehiclesDB — marcas                                                     */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("2/7 VehiclesDB: marcas...");

const makeByExternalId = new Map(
  vdbMakesRaw.map((make) => [make.id, make]),
);

const makeRows = vdbMakesRaw.map((make) => ({
  external_key: `vehiclesdb:${make.id}`,
  name: make.name,
  normalized_name: normalize(make.name),
  aliases: uniqueStrings(make.aliases ?? []),
  sources: ["vehiclesdb"],
}));

await upsertChunk(
  "vehicle_makes",
  makeRows,
  "normalized_name",
);

/* -------------------------------------------------------------------------- */
/* 3. Resolver marcas                                                         */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("3/7 A resolver marcas locais...");

let dbMakes = await selectAll(
  "vehicle_makes",
  "id,name,normalized_name,aliases,sources",
);

/* -------------------------------------------------------------------------- */
/* 3A. Criar marcas adicionais autorizadas do gor3a                           */
/* -------------------------------------------------------------------------- */

const existingMakeNames = new Set(
  dbMakes.flatMap((make) => [
    normalize(make.name),
    normalize(make.normalized_name),
    ...(make.aliases ?? []).map((alias) => normalize(alias)),
  ]),
);

const gor3aMakeRows = [];

for (const [sourceName, rule] of Object.entries(
  GOR3A_MAKE_RULES,
)) {
  if (!rule.create) continue;

  const canonical = String(rule.create).trim();
  const normalizedCanonical = normalize(canonical);

  if (
    existingMakeNames.has(normalizedCanonical) ||
    existingMakeNames.has(normalize(sourceName))
  ) {
    continue;
  }

  gor3aMakeRows.push({
    external_key: `gor3a:make:${normalize(sourceName)}`,
    name: canonical,
    normalized_name: normalizedCanonical,
    aliases: uniqueStrings([
      sourceName,
      ...(rule.aliases ?? []),
    ]),
    sources: ["gor3a"],
  });

  existingMakeNames.add(normalizedCanonical);
  existingMakeNames.add(normalize(sourceName));
}

if (gor3aMakeRows.length) {
  console.log(
    `A criar ${gor3aMakeRows.length} marcas adicionais do gor3a...`,
  );

  await upsertChunk(
    "vehicle_makes",
    gor3aMakeRows,
    "normalized_name",
  );

  dbMakes = await selectAll(
    "vehicle_makes",
    "id,name,normalized_name,aliases,sources",
  );
}

/**
 * Índices:
 *
 * exact:
 *   "volkswagen" -> ID
 *
 * compact:
 *   "mercedesbenz" -> ID
 *
 * aliases:
 *   aliases do VehiclesDB -> ID
 */
const makeExactIndex = new Map();
const makeCompactIndex = new Map();

for (const make of dbMakes) {
  makeExactIndex.set(
    normalize(make.name),
    make.id,
  );

  makeExactIndex.set(
    make.normalized_name,
    make.id,
  );

  makeCompactIndex.set(
    compact(make.name),
    make.id,
  );

  for (const alias of make.aliases ?? []) {
    makeExactIndex.set(
      normalize(alias),
      make.id,
    );

    makeCompactIndex.set(
      compact(alias),
      make.id,
    );
  }
}

function resolveMake(name) {
  const normalized = normalize(name);
  const compacted = compact(name);

  let id =
    makeExactIndex.get(normalized) ??
    makeCompactIndex.get(compacted);

  if (id) return id;

  const explicitRule =
    GOR3A_MAKE_RULES[normalized] ??
    GOR3A_MAKE_RULES[compacted];

  if (explicitRule?.target) {
    id =
      makeExactIndex.get(normalize(explicitRule.target)) ??
      makeCompactIndex.get(compact(explicitRule.target));

    if (id) return id;
  }

  if (explicitRule?.create) {
    id =
      makeExactIndex.get(normalize(explicitRule.create)) ??
      makeCompactIndex.get(compact(explicitRule.create));

    if (id) return id;
  }

  const safeAlias =
    SAFE_MAKE_ALIASES.get(normalized) ??
    SAFE_MAKE_ALIASES.get(compacted);

  if (safeAlias) {
    id =
      makeExactIndex.get(normalize(safeAlias)) ??
      makeCompactIndex.get(compact(safeAlias));

    if (id) return id;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* 4. VehiclesDB — modelos                                                    */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("4/7 VehiclesDB: modelos...");

const modelRows = [];

for (const model of vdbModelsRaw) {
  const make = makeByExternalId.get(model.make_id);

  if (!make) continue;

  const makeId = resolveMake(make.name);

  if (!makeId) continue;

  const availability =
    model.availability?.countries ??
    model.availability ??
    {};

  const countries = Array.isArray(availability)
    ? availability
    : Object.keys(availability)
        .filter((country) =>
          /^[A-Za-z]{2}$/.test(country),
        );

  modelRows.push({
    make_id: makeId,
    external_key: `vehiclesdb:${model.id}`,
    name: model.name,
    normalized_name: normalize(model.name),
    aliases: uniqueStrings(model.aliases ?? []),
    body_types: model.body_types ?? [],
    countries,
    regions: model.regions ?? [],
    popularity_decile:
      model.popularity?.global_decile ??
      model.global_popularity_decile ??
      null,
    sources: ["vehiclesdb"],
  });
}

await upsertChunk(
  "vehicle_models",
  modelRows,
  "make_id,normalized_name",
);

/* -------------------------------------------------------------------------- */
/* 5. gor3a — complementar modelos                                            */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("5/7 gor3a: complementar modelos das marcas existentes...");

/**
 * O erro mais importante da versão antiga era:
 *
 *   if (!localModelId) continue;
 *
 * Portanto milhares de gerações e motores eram descartados.
 *
 * Agora:
 * - resolvemos a marca;
 * - se o modelo não existir, criamo-lo;
 * - só depois importamos gerações e motores.
 */

const gor3aModelsToAdd = [];

const unmatchedMakes = new Map();

let gorMakeCount = 0;
let gorModelCount = 0;

for (const group of gor3aRaw ?? []) {
  for (const make of group.makes ?? []) {
    gorMakeCount++;

    const makeId = resolveMake(make.name);

    if (!makeId) {
      const key = normalize(make.name);

      unmatchedMakes.set(
        key,
        (unmatchedMakes.get(key) ?? 0) + 1,
      );

      continue;
    }

    for (const model of make.models ?? []) {
      gorModelCount++;

      const name = String(model.name ?? "").trim();

      if (!name) continue;

      gor3aModelsToAdd.push({
        make_id: makeId,
        external_key:
          model.id
            ? `gor3a:${model.id}`
            : null,
        name,
        normalized_name: normalize(name),
        aliases: [],
        body_types: [],
        countries: [],
        regions: [],
        popularity_decile: null,
        sources: ["gor3a"],
      });
    }
  }
}

/**
 * Deduplicar antes do UPSERT.
 */
const uniqueGor3aModels = [
  ...new Map(
    gor3aModelsToAdd.map((model) => [
      `${model.make_id}|||${model.normalized_name}`,
      model,
    ]),
  ).values(),
];

console.log(
  `gor3a: ${gorMakeCount} entradas de marca / ${gorModelCount} modelos analisados`,
);

console.log(
  `gor3a: ${uniqueGor3aModels.length} modelos candidatos`,
);

/**
 * IMPORTANTÍSSIMO:
 *
 * Se o modelo já existir no VehiclesDB, não queremos substituir
 * metadata melhor (aliases, countries, popularity, sources).
 *
 * Por isso verificamos primeiro quais já existem e só inserimos
 * efetivamente os que faltam.
 */

const existingModelsBeforeGor = await selectAll(
  "vehicle_models",
  "id,make_id,normalized_name",
);

const existingModelKeys = new Set(
  existingModelsBeforeGor.map(
    (model) =>
      `${model.make_id}|||${model.normalized_name}`,
  ),
);

const trulyNewGor3aModels =
  uniqueGor3aModels.filter(
    (model) =>
      !existingModelKeys.has(
        `${model.make_id}|||${model.normalized_name}`,
      ),
  );

console.log(
  `gor3a: ${trulyNewGor3aModels.length} modelos novos a acrescentar`,
);

if (trulyNewGor3aModels.length) {
  await upsertChunk(
    "vehicle_models",
    trulyNewGor3aModels,
    "make_id,normalized_name",
  );
}

/* -------------------------------------------------------------------------- */
/* Índice final dos modelos                                                   */
/* -------------------------------------------------------------------------- */

const dbModels = await selectAll(
  "vehicle_models",
  "id,make_id,name,normalized_name,aliases,sources",
);

const modelExactIndex = new Map();
const modelCompactIndex = new Map();

for (const model of dbModels) {
  const exactKey =
    `${model.make_id}|||${model.normalized_name}`;

  modelExactIndex.set(
    exactKey,
    model.id,
  );

  modelCompactIndex.set(
    `${model.make_id}|||${compact(model.name)}`,
    model.id,
  );

  for (const alias of model.aliases ?? []) {
    modelExactIndex.set(
      `${model.make_id}|||${normalize(alias)}`,
      model.id,
    );

    modelCompactIndex.set(
      `${model.make_id}|||${compact(alias)}`,
      model.id,
    );
  }
}

function resolveModel(
  makeId,
  modelName,
) {
  const exact =
    modelExactIndex.get(
      `${makeId}|||${normalize(modelName)}`,
    );

  if (exact) return exact;

  /**
   * Isto resolve diferenças puramente tipográficas:
   *
   * "C-Class"   = "C Class"
   * "3-Series"  = "3 Series"
   *
   * Não fazemos similaridade fuzzy arbitrária.
   */
  return (
    modelCompactIndex.get(
      `${makeId}|||${compact(modelName)}`,
    ) ??
    null
  );
}

/* -------------------------------------------------------------------------- */
/* 6. gor3a — gerações e variantes                                            */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("6/7 gor3a: gerações e variantes...");

const generationRows = [];
const deferredEngines = [];

let matchedMakes = 0;
let matchedModels = 0;
let unmatchedModels = 0;
let rawGenerations = 0;
let rawEngines = 0;

const unmatchedModelExamples = [];

for (const group of gor3aRaw ?? []) {
  for (const make of group.makes ?? []) {
    const makeId = resolveMake(make.name);

    if (!makeId) continue;

    matchedMakes++;

    for (const model of make.models ?? []) {
      const localModelId =
        resolveModel(
          makeId,
          model.name,
        );

      if (!localModelId) {
        unmatchedModels++;

        if (unmatchedModelExamples.length < 30) {
          unmatchedModelExamples.push(
            `${make.name} → ${model.name}`,
          );
        }

        continue;
      }

      matchedModels++;

      for (const generation of model.generations ?? []) {
        rawGenerations++;

        const generationName =
          generation.name ||
          `${model.name} ${generation.yearStart ?? ""}`.trim();

        generationRows.push({
          model_id: localModelId,
          external_key:
            generation.id
              ? `gor3a:${generation.id}`
              : null,
          name: generationName,
          normalized_name: normalize(generationName),
          year_start:
            nullableInt(generation.yearStart),
          year_end:
            nullableInt(generation.yearEnd),
          body_type:
            generation.bodyType ?? null,
          sources: ["gor3a"],
        });

        const engines =
          Array.isArray(generation.engines)
            ? generation.engines
            : [];

        rawEngines += engines.length;

        deferredEngines.push({
          modelId: localModelId,
          generationName,
          generationYear:
            nullableInt(generation.yearStart),
          engines,
        });
      }
    }
  }
}

console.log(
  `gor3a correspondências: ${matchedModels} modelos encontrados`,
);

console.log(
  `gor3a bruto: ${rawGenerations} gerações / ${rawEngines} variantes`,
);

/**
 * Gerações e variantes gor3a são reconstruídas de raiz.
 *
 * vehicle_variants primeiro porque depende de vehicle_generations.
 */
const {
  error: variantDeleteError,
} = await supabase
  .from("vehicle_variants")
  .delete()
  .gt("id", 0);

if (variantDeleteError) {
  throw variantDeleteError;
}

const {
  error: generationDeleteError,
} = await supabase
  .from("vehicle_generations")
  .delete()
  .gt("id", 0);

if (generationDeleteError) {
  throw generationDeleteError;
}

/* -------------------------------------------------------------------------- */
/* Gerações                                                                   */
/* -------------------------------------------------------------------------- */

const uniqueGenerations = [
  ...new Map(
    generationRows.map((generation) => [
      [
        generation.model_id,
        generation.normalized_name,
        generation.year_start ?? "",
      ].join("|||"),
      generation,
    ]),
  ).values(),
];

console.log(
  `vehicle_generations: ${generationRows.length} recebidas, ${uniqueGenerations.length} únicas`,
);

await upsertChunk(
  "vehicle_generations",
  uniqueGenerations,
  "model_id,normalized_name,year_start",
  300,
);

/* -------------------------------------------------------------------------- */
/* Resolver IDs das gerações                                                  */
/* -------------------------------------------------------------------------- */

const dbGenerations = await selectAll(
  "vehicle_generations",
  "id,model_id,normalized_name,year_start",
);

const generationId = new Map(
  dbGenerations.map((generation) => [
    [
      generation.model_id,
      generation.normalized_name,
      generation.year_start ?? "",
    ].join("|||"),
    generation.id,
  ]),
);

/* -------------------------------------------------------------------------- */
/* Variantes                                                                  */
/* -------------------------------------------------------------------------- */

const variantRows = [];

let enginesWithoutGeneration = 0;
let enginesWithoutLabel = 0;

let sanitizedPowerHp = 0;
let sanitizedPowerKw = 0;
let sanitizedDisplacement = 0;
let sanitizedCylinders = 0;

function extractHpFromLabel(label) {
  const matches = [
    ...String(label ?? "").matchAll(/(?:\(|\b)(\d{1,4})\s*HP\b/gi),
  ];

  if (!matches.length) return null;

  const value = Number(matches.at(-1)?.[1]);

  return Number.isInteger(value) &&
    value > 0 &&
    value <= 2500
    ? value
    : null;
}

function sanitizePowerHp(value, label) {
  const raw = nullableInt(value);

  if (raw === null) return null;

  if (raw > 0 && raw <= 2500) {
    return raw;
  }

  const fromLabel = extractHpFromLabel(label);

  if (fromLabel !== null) {
    sanitizedPowerHp++;
    return fromLabel;
  }

  sanitizedPowerHp++;
  return null;
}

function sanitizePowerKw(value) {
  const raw = nullableInt(value);

  if (raw === null) return null;

  if (raw > 0 && raw <= 2000) {
    return raw;
  }

  sanitizedPowerKw++;
  return null;
}

function sanitizeDisplacementCc(value) {
  const raw = nullableInt(value);

  if (raw === null) return null;

  if (raw > 0 && raw <= 12000) {
    return raw;
  }

  sanitizedDisplacement++;
  return null;
}

function sanitizeCylinders(value) {
  const raw = nullableInt(value);

  if (raw === null) return null;

  if (raw >= 1 && raw <= 16) {
    return raw;
  }

  sanitizedCylinders++;
  return null;
}

for (const item of deferredEngines) {
  const key = [
    item.modelId,
    normalize(item.generationName),
    item.generationYear ?? "",
  ].join("|||");

  const generationLocalId =
    generationId.get(key);

  if (!generationLocalId) {
    enginesWithoutGeneration +=
      item.engines.length;

    continue;
  }

  for (const engine of item.engines) {
    /**
     * O gor3a normalmente fornece label.
     * Quando não fornece, fabricamos uma descrição legível.
     */
    const label =
      String(engine.label ?? "").trim() ||
      [
        engine.displacement
          ? String(engine.displacement)
          : null,

        engine.transmission
          ? String(engine.transmission)
          : null,

        engine.drivetrain
          ? String(engine.drivetrain)
          : null,

        engine.powerHp !== undefined &&
        engine.powerHp !== null
          ? `${engine.powerHp} HP`
          : null,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (!label) {
      enginesWithoutLabel++;
      continue;
    }

    variantRows.push({
      generation_id: generationLocalId,

      external_key:
        engine.id
          ? `gor3a:${engine.id}`
          : null,

      name: label,

      normalized_name:
        normalize(label),

      fuel_type:
        engine.fuelType ?? null,

      displacement_cc:
        sanitizeDisplacementCc(
          engine.displacementCc,
        ),

      power_hp:
        sanitizePowerHp(
          engine.powerHp,
          label,
        ),

      power_kw:
        sanitizePowerKw(
          engine.powerKw,
        ),

      cylinders:
        sanitizeCylinders(
          engine.cylinders,
        ),

      transmission:
        engine.transmission ?? null,

      drivetrain:
        engine.drivetrain ?? null,

      sources: ["gor3a"],
    });
  }
}

console.log(
  `Sanitização técnica: ${sanitizedPowerHp} potência HP / ${sanitizedPowerKw} potência kW / ${sanitizedDisplacement} cilindrada / ${sanitizedCylinders} cilindros`,
);

/**
 * Evitar variantes repetidas dentro da mesma geração.
 *
 * Como alguns IDs upstream podem faltar, usamos uma assinatura
 * técnica suficientemente conservadora.
 */
const uniqueVariants = [
  ...new Map(
    variantRows.map((variant) => [
      [
        variant.generation_id,
        variant.normalized_name,
        normalize(variant.fuel_type ?? ""),
        variant.displacement_cc ?? "",
        variant.power_hp ?? "",
        normalize(variant.transmission ?? ""),
        normalize(variant.drivetrain ?? ""),
      ].join("|||"),
      variant,
    ]),
  ).values(),
];

console.log(
  `vehicle_variants: ${variantRows.length} recebidas, ${uniqueVariants.length} únicas`,
);

await insertChunk(
  "vehicle_variants",
  uniqueVariants,
  300,
);

/* -------------------------------------------------------------------------- */
/* Diagnóstico                                                                */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("Diagnóstico gor3a:");

console.log(
  `  Modelos correspondidos: ${matchedModels}`,
);

console.log(
  `  Modelos sem correspondência: ${unmatchedModels}`,
);

console.log(
  `  Motores sem geração local: ${enginesWithoutGeneration}`,
);

console.log(
  `  Motores sem nome utilizável: ${enginesWithoutLabel}`,
);

if (unmatchedMakes.size) {
  console.log("");
  console.log(
    `  Marcas gor3a não reconhecidas: ${unmatchedMakes.size}`,
  );

  console.log(
    "  Primeiros exemplos:",
  );

  for (
    const [name] of
    [...unmatchedMakes.entries()]
  ) {
    console.log(`    - ${name}`);
  }
}

if (unmatchedModelExamples.length) {
  console.log("");
  console.log(
    "  Exemplos de modelos não correspondidos:",
  );

  for (const value of unmatchedModelExamples) {
    console.log(`    - ${value}`);
  }
}

/* -------------------------------------------------------------------------- */
/* 7. Estatísticas finais                                                     */
/* -------------------------------------------------------------------------- */

console.log("");
console.log("7/7 Estatísticas finais...");

for (const table of [
  "vehicle_makes",
  "vehicle_models",
  "vehicle_generations",
  "vehicle_variants",
]) {
  const {
    count,
    error,
  } = await supabase
    .from(table)
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) {
    console.warn(
      `${table}: ${error.message}`,
    );
  } else {
    console.log(
      `${table}: ${count}`,
    );
  }
}

console.log("");
console.log("Catálogo sincronizado.");
console.log("");
