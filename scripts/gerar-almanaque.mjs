// scripts/gerar-almanaque.mjs
// Lê content/Almanaque_Diario_Completo.md (fonte única, ver README do
// projeto) e gera lib/calendario/almanaque.json com uma entrada por dia,
// indexada por "MM-DD" (independente do ano -- o almanaque repete-se
// todos os anos). Corre em "npm run dev"/"npm run build" (prescripts) ou
// manualmente com "npm run gerar:almanaque".

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");
const FICHEIRO_FONTE = path.join(RAIZ, "content", "Almanaque_Diario_Completo.md");
const FICHEIRO_SAIDA = path.join(RAIZ, "lib", "calendario", "almanaque.json");

const MESES = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  "MARÇO": 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
};

// Cabeçalho de um dia real do almanaque, ex: "# 29 DE FEVEREIRO".
// Os 26 blocos "# RESUMO DA ... SEMANA DE <MÊS>" (editorial, sem data
// própria) não batem com este padrão e ficam de fora deste parser.
const PADRAO_DIA = /^# (\d{1,2}) DE ([A-ZÇ]+)$/;
const PADRAO_SECCAO = /^## (.+)$/;

const CAMPOS_POR_SECCAO = {
  "Santo do Dia": "santo",
  "Provérbio": "proverbio",
  Agricultura: "agricultura",
  "Horta e Jardim": "hortaJardim",
  Natureza: "natureza",
  Astronomia: "astronomia",
  Curiosidade: "curiosidade",
};

function mapearCampo(nomeSeccao) {
  if (CAMPOS_POR_SECCAO[nomeSeccao]) return CAMPOS_POR_SECCAO[nomeSeccao];
  if (nomeSeccao === "Efeméride" || nomeSeccao.startsWith("Efemérides")) return "efemerides";
  return null;
}

// Converte as linhas em bruto de uma secção numa lista de itens de texto:
// linhas "* item" viram um item por bullet; "> citação" vira um item sem o
// ">"; texto corrido em parágrafo(s) separados por linha em branco.
function analisarLinhasSeccao(linhas) {
  const itens = [];
  let paragrafo = [];

  function fecharParagrafo() {
    if (paragrafo.length) {
      itens.push(paragrafo.join(" ").trim());
      paragrafo = [];
    }
  }

  for (const linhaCrua of linhas) {
    const linha = linhaCrua.trim();
    if (linha === "" || /^([-*_])\1{2,}$/.test(linha)) {
      // linha em branco ou separador markdown (---, ***, ___) entre dias
      fecharParagrafo();
      continue;
    }
    if (linha.startsWith("* ")) {
      fecharParagrafo();
      itens.push(linha.slice(2).trim());
      continue;
    }
    if (linha.startsWith("> ")) {
      fecharParagrafo();
      itens.push(linha.slice(2).trim());
      continue;
    }
    // Alguns dias nomeiam o santo/festa com um subtítulo dentro da secção
    // (ex: "## Santo do Dia" seguido de "### Nossa Senhora do Carmo") em
    // vez de texto corrido — vira um item próprio, sem o(s) "#".
    const tituloMatch = linha.match(/^#{2,6}\s*(.+)$/);
    if (tituloMatch) {
      fecharParagrafo();
      itens.push(tituloMatch[1].trim());
      continue;
    }
    paragrafo.push(linha);
  }
  fecharParagrafo();
  return itens.filter(Boolean);
}

function extrairSeccoes(blocoLinhas, avisos, chaveDia) {
  const brutoPorSeccao = new Map();
  let seccaoAtual = null;

  for (const linha of blocoLinhas) {
    const m = linha.match(PADRAO_SECCAO);
    if (m) {
      seccaoAtual = m[1].trim();
      if (!brutoPorSeccao.has(seccaoAtual)) brutoPorSeccao.set(seccaoAtual, []);
      continue;
    }

    // Cabeçalho de nível >=3 (ou fence ":::"). Alguns dias nomeiam o
    // santo/festa assim logo no início de uma secção (ex: "## Santo do
    // Dia" seguido de "### Nossa Senhora do Carmo") — legítimo, fica como
    // texto normal (ver analisarLinhasSeccao). Mas se a secção atual JÁ
    // tem conteúdo, isto é ruído editorial que por engano ficou dentro do
    // bloco do dia (resumo semanal mal aninhado — "### RESUMO DA SEGUNDA
    // SEMANA DE MAIO" — ou notas de progresso do autor — "### Concluído",
    // "### Estado do Capítulo Janeiro", "### Próximo bloco"): o resto do
    // bloco é descartado a partir daqui.
    if (/^#{3,}/.test(linha) || /^:::/.test(linha)) {
      const linhasAtuais = seccaoAtual ? brutoPorSeccao.get(seccaoAtual) : null;
      const seccaoTemConteudo = linhasAtuais?.some((l) => l.trim() !== "");
      if (!seccaoAtual || seccaoTemConteudo || /^:::/.test(linha)) {
        avisos.push(`${chaveDia}: bloco truncado em "${linha.trim()}" (ruído editorial)`);
        break;
      }
    }

    if (seccaoAtual) brutoPorSeccao.get(seccaoAtual).push(linha);
  }

  const dia = {};
  for (const [nomeSeccao, linhas] of brutoPorSeccao) {
    const itens = analisarLinhasSeccao(linhas);
    if (!itens.length) continue;

    const campo = mapearCampo(nomeSeccao);
    if (!campo) {
      avisos.push(`${chaveDia}: secção desconhecida ignorada — "${nomeSeccao}"`);
      continue;
    }
    // Nunca deveria haver duas secções com o mesmo campo no mesmo dia; se
    // acontecer (ficheiro-fonte inconsistente), concatena em vez de perder
    // dados, e avisa.
    if (dia[campo]) {
      avisos.push(`${chaveDia}: secção "${nomeSeccao}" duplicada — conteúdo concatenado`);
      dia[campo] = dia[campo].concat(itens);
    } else {
      dia[campo] = itens;
    }
  }
  return dia;
}

function gerar() {
  if (!existsSync(FICHEIRO_FONTE)) {
    console.error(`Ficheiro fonte não encontrado: ${FICHEIRO_FONTE}`);
    process.exit(1);
  }

  const linhas = readFileSync(FICHEIRO_FONTE, "utf8").split("\n");
  const avisos = [];
  const almanaque = {};
  let i = 0;

  while (i < linhas.length) {
    const m = linhas[i].match(PADRAO_DIA);
    if (!m) {
      i++;
      continue;
    }
    const dia = Number(m[1]);
    const mes = MESES[m[2]];
    if (!mes) {
      avisos.push(`Cabeçalho de dia com mês desconhecido, ignorado: "${linhas[i]}"`);
      i++;
      continue;
    }
    const chaveDia = `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    i++;

    // Recolhe tudo até ao próximo cabeçalho de nível 1 (dia seguinte, ou
    // um bloco "# RESUMO..."/mês solto, que já ficam de fora por não
    // baterem com PADRAO_DIA). A limpeza de ruído editorial aninhado
    // dentro do próprio bloco acontece em extrairSeccoes.
    const blocoLinhas = [];
    while (i < linhas.length && !/^# /.test(linhas[i])) {
      blocoLinhas.push(linhas[i]);
      i++;
    }

    if (almanaque[chaveDia]) {
      avisos.push(`Dia duplicado no ficheiro-fonte, ignorada a repetição: "${chaveDia}"`);
      continue;
    }
    almanaque[chaveDia] = extrairSeccoes(blocoLinhas, avisos, chaveDia);
  }

  const totalDias = Object.keys(almanaque).length;
  writeFileSync(FICHEIRO_SAIDA, JSON.stringify(almanaque, null, 2) + "\n", "utf8");

  console.log(`almanaque.json gerado: ${totalDias} dias (esperado: 366, incluindo 29 de Fevereiro).`);
  if (totalDias !== 366) {
    console.warn(`⚠ Contagem de dias diferente de 366 — verificar o ficheiro-fonte.`);
  }
  if (avisos.length) {
    console.warn(`Avisos (${avisos.length}):`);
    for (const aviso of avisos) console.warn(`  - ${aviso}`);
  }
}

gerar();
