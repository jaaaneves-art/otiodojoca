// Gera sql/culturas_guia_seed.sql a partir dos dados compilados de
// docs/camada-2/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md, cruzados com as
// categorias de fase lunar ja publicadas em lib/calendario/tradicao.ts
// (decisao do utilizador: manter tradicao.ts, nao o "qualquer" generico
// do Volume_IV). Campos sem dado na fonte ficam NULL -- nada inventado.

import { writeFileSync } from "node:fs";

const CRESCENTE = "crescente";
const MINGUANTE = "minguante";

// [nome, categoria, perene, cicloMin, cicloMax, semeaduraFase, podaFase,
//  mesesSemeadura, mesesColheita, mesesPoda, tempOtima, dicas]
const CULTURAS = [
  // Hortaliças (ciclo/meses/temp do Volume_IV; fase lunar de tradicao.ts:
  // Folhosas/Frutos -> crescente, Raízes/Tubérculos -> minguante)
  ["Alface", "Hortaliça", false, 30, 50, CRESCENTE, null, "Janeiro, Fevereiro, Setembro", "Fevereiro, Abril, Novembro", null, 15, null],
  ["Tomate", "Hortaliça", false, 60, 80, CRESCENTE, null, "Março (alfobre)", "Julho a Setembro", null, 22.5, null],
  ["Pimento", "Hortaliça", false, 70, 90, CRESCENTE, null, "Março (alfobre)", "Julho a Setembro", null, 22.5, null],
  ["Beringela", "Hortaliça", false, 70, 85, CRESCENTE, null, "Março (alfobre)", "Julho a Setembro", null, 25, null],
  ["Cebola", "Hortaliça", false, 120, 150, MINGUANTE, null, "Janeiro, Fevereiro", "Maio, Junho", null, 16, null],
  ["Batata", "Hortaliça", false, 70, 90, MINGUANTE, null, "Março", "Junho", null, 17.5, null],
  ["Cenoura", "Hortaliça", false, 60, 80, MINGUANTE, null, "Janeiro, Fevereiro", "Abril, Maio", null, 17.5, null],
  ["Beterraba", "Hortaliça", false, 70, 90, MINGUANTE, null, "Janeiro, Fevereiro, Setembro", "Abril a Junho, Novembro", null, 17.5, null],
  ["Rabanete", "Hortaliça", false, 30, 40, MINGUANTE, null, "Janeiro, Fevereiro, Setembro", "Fevereiro a Abril, Outubro, Novembro", null, 15, null],
  ["Espinafre", "Hortaliça", false, 40, 50, CRESCENTE, null, "Janeiro, Fevereiro, Setembro", "Fevereiro a Abril, Outubro, Novembro", null, 12.5, null],
  ["Couve / Repolho", "Hortaliça", false, 90, 120, CRESCENTE, null, "Fevereiro, Setembro", "Maio, Outubro, Novembro", null, 16.5, null],
  ["Couve-flor", "Hortaliça", false, 90, 120, CRESCENTE, null, "Fevereiro, Setembro", "Abril, Maio, Outubro, Novembro", null, 17.5, null],
  ["Melancia", "Hortaliça", false, 70, 100, CRESCENTE, null, "Março, Abril", "Julho, Agosto", null, 27.5, null],
  ["Melão", "Hortaliça", false, 70, 90, CRESCENTE, null, "Março, Abril", "Julho, Agosto", null, 27.5, null],
  ["Abóbora", "Hortaliça", false, 90, 120, CRESCENTE, null, "Abril, Maio", "Agosto, Setembro", null, 22.5, null],

  // Hortaliças só citadas em texto corrido no Volume_IV, sem ciclo/temp
  // estruturados -- entradas propositadamente incompletas.
  ["Nabo", "Hortaliça", false, null, null, MINGUANTE, null, null, "Outubro", null, null,
    "Volume_IV só cita este dia em texto corrido (sementeira janeiro, colheita outubro); sem ciclo em dias nem temperatura."],
  ["Salsa", "Hortaliça", false, null, null, CRESCENTE, null, "Janeiro", null, null, null,
    "Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura."],
  ["Coentro", "Hortaliça", false, null, null, CRESCENTE, null, "Janeiro", null, null, null,
    "Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura."],
  ["Agrião", "Hortaliça", false, null, null, CRESCENTE, null, "Janeiro", null, null, null,
    "Volume_IV só cita sementeira de janeiro em texto corrido; sem ciclo em dias, colheita nem temperatura."],

  // Legumes (ciclo/meses do Volume_IV; sem temperatura na fonte)
  ["Feijão", "Legume", false, 60, 80, CRESCENTE, null, "Março, Abril", "Julho, Agosto", null, null, null],
  ["Ervilha", "Legume", false, 60, 70, CRESCENTE, null, "Janeiro, Fevereiro", "Abril, Maio", null, null, null],
  ["Grão", "Legume", false, 120, 150, CRESCENTE, null, "Março, Abril", "Agosto, Setembro", null, null,
    'Volume_IV indica ciclo "120+ dias"; o máximo aqui (150) é uma estimativa a validar.'],

  // Cereais (ciclo/meses do Volume_IV; sem temperatura na fonte;
  // fase lunar de tradicao.ts, categoria Cereais -> crescente)
  ["Trigo", "Cereal", false, 180, 200, CRESCENTE, null, "Outubro, Novembro", "Junho, Julho", null, null, null],
  ["Cevada", "Cereal", false, 160, 180, CRESCENTE, null, "Outubro, Novembro", "Maio, Junho", null, null, null],
  ["Centeio", "Cereal", false, 180, 200, CRESCENTE, null, "Outubro, Novembro", "Junho, Julho", null, null, null],
  ["Milho", "Cereal", false, 90, 120, CRESCENTE, null, "Abril, Maio", "Agosto, Setembro", null, null, null],

  // Fruteiras perenes (Volume_IV): sem sementeira/ciclo em dias (perenes);
  // poda em Quarto Minguante quando a fonte especifica.
  ["Pessegueiro", "Fruteira", true, null, null, null, MINGUANTE, null, "Julho, Agosto", "Janeiro, Fevereiro", null, null],
  ["Ameixieira", "Fruteira", true, null, null, null, MINGUANTE, null, "Junho, Julho", "Janeiro, Fevereiro", null, null],
  ["Macieira", "Fruteira", true, null, null, null, MINGUANTE, null, "Setembro, Outubro", "Janeiro a Março", null, null],
  ["Pereira", "Fruteira", true, null, null, null, MINGUANTE, null, "Agosto, Setembro", "Janeiro a Março", null, null],
  ["Figueira", "Fruteira", true, null, null, null, MINGUANTE, null, "Agosto, Setembro", "Janeiro", null, null],
  ["Diospireiro", "Fruteira", true, null, null, null, MINGUANTE, null, "Outubro, Novembro", "Janeiro", null, null],
  ["Videira", "Fruteira", true, null, null, null, MINGUANTE, null, "Setembro", "Janeiro a Março", null, null],
  ["Oliveira", "Fruteira", true, null, null, null, MINGUANTE, null, "Outubro, Novembro", "Outubro a Janeiro", null, null],
  ["Framboesa", "Fruteira", true, null, null, null, null, null, "Junho", "Janeiro", null,
    "Volume_IV não especifica a fase lunar da poda para esta cultura."],
  ["Morango", "Fruteira", true, null, null, null, null, null, "Maio, Junho", null, null,
    "Volume_IV indica poda \"conforme a variedade\", sem mês nem fase lunar definidos."],

  // Aromáticas -- só citadas na lista-resumo do Volume_IV, sem qualquer
  // dado estruturado (ciclo, meses, temperatura).
  ["Hortelã", "Aromática", true, null, null, null, null, null, null, null, null,
    "Volume_IV só cita o nome na lista-resumo; sem ciclo, meses nem temperatura."],
  ["Tomilho", "Aromática", true, null, null, null, null, null, null, null, null,
    "Volume_IV só cita o nome na lista-resumo; sem ciclo, meses nem temperatura."],

  // Apicultura -- sem "ciclo" em dias; atividade sazonal (ver dicas).
  ["Abelhas", "Apicultura", true, null, null, null, null, null, null, null, null,
    "Atividade sazonal (Volume_IV): repouso/consumo de mel em janeiro-fevereiro; despertar em março; floração e pico de mel de abril a setembro; preparação de inverno em outubro-novembro."],
];

function sqlTexto(valor) {
  if (valor === null || valor === undefined) return "NULL";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function sqlBooleano(valor) {
  return valor ? "true" : "false";
}

function sqlNumero(valor) {
  return valor === null || valor === undefined ? "NULL" : String(valor);
}

const linhas = CULTURAS.map(
  ([
    nome, categoria, perene, cicloMin, cicloMax, semeaduraFase, podaFase,
    mesesSemeadura, mesesColheita, mesesPoda, tempOtima, dicas,
  ]) =>
    "  (" +
    [
      sqlTexto(nome),
      sqlTexto(categoria),
      sqlBooleano(perene),
      sqlNumero(cicloMin),
      sqlNumero(cicloMax),
      sqlTexto(semeaduraFase),
      sqlTexto(podaFase),
      sqlTexto(mesesSemeadura),
      sqlTexto(mesesColheita),
      sqlTexto(mesesPoda),
      sqlNumero(tempOtima),
      sqlTexto(dicas),
    ].join(", ") +
    ")",
);

const sql = `-- Gerado por scripts/gerar-culturas-guia-seed.mjs a partir de
-- docs/camada-2/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md, cruzado com as
-- fases lunares por categoria de lib/calendario/tradicao.ts. Correr
-- depois de sql/AGENDA_AGRICOLA.sql. Campos sem dado na fonte ficam
-- NULL -- nada inventado; ver comentário "dicas" nas entradas incompletas.

INSERT INTO culturas_guia (
  nome, categoria, perene, ciclo_dias_min, ciclo_dias_max,
  semeadura_fase_lunar, poda_fase_lunar,
  meses_semeadura, meses_colheita, meses_poda,
  temp_otima, dicas
) VALUES
${linhas.join(",\n")}
ON CONFLICT (nome) DO NOTHING;
`;

const SAIDA = new URL("../sql/culturas_guia_seed.sql", import.meta.url);
writeFileSync(SAIDA, sql, "utf8");
console.log(`culturas_guia_seed.sql gerado: ${CULTURAS.length} culturas.`);
