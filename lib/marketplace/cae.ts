// lib/marketplace/cae.ts
import { CAE_LISTA, type CaeEntry } from './cae-lista';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas diacríticas combinadas, após NFD)
    .toLowerCase()
    .trim();
}

/**
 * Pesquisa CAE por prefixo de código (ex: "470") ou por texto contido na
 * descrição (ex: "cabeleireiro"), sem distinguir acentos/maiúsculas.
 * Devolve no máximo `limite` resultados.
 */
export function pesquisarCae(termo: string, limite = 10): CaeEntry[] {
  const termoLimpo = termo.trim();
  if (!termoLimpo) return [];

  // Pesquisa por código: só dígitos
  if (/^\d+$/.test(termoLimpo)) {
    return CAE_LISTA.filter((c) => c.codigo.startsWith(termoLimpo)).slice(0, limite);
  }

  const termoNormalizado = normalizar(termoLimpo);
  return CAE_LISTA.filter((c) => normalizar(c.descricao).includes(termoNormalizado)).slice(
    0,
    limite
  );
}

/** Obtém uma entrada CAE pelo código exato (5 dígitos). */
export function obterCaePorCodigo(codigo: string): CaeEntry | undefined {
  return CAE_LISTA.find((c) => c.codigo === codigo);
}

/** Formata uma entrada CAE para exibição: "47111 — Comércio a retalho..." */
export function formatarCae(codigo: string): string {
  const entrada = obterCaePorCodigo(codigo);
  if (!entrada) return codigo;
  return `${entrada.codigo} — ${entrada.descricao}`;
}
