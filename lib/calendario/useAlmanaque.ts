/**
 * useAlmanaque - Hook para carregar dados do Almanaque Diário
 * Projeto: O Tio do Joca
 * Módulo: Calendário Lunar - Fase 1: Almanaque
 */

import { useMemo } from 'react';
import type { AlmanaqueDia, AlmanaqueDiarioType } from './tipos-almanaque';
import almanaque from './almanaque.json';

class AlmanaqueDiarioLoader {
  private data: AlmanaqueDiarioType;

  constructor(alm: AlmanaqueDiarioType) {
    this.data = alm;
  }

  /**
   * Obter dia do almanaque por data
   * @param data Date ou string "MM-DD" ou "YYYY-MM-DD"
   * @returns AlmanaqueDia ou null
   */
  obterPorData(data: Date | string): AlmanaqueDia | null {
    const chave = this.extrairChaveMD(data);
    return chave ? (this.data[chave] ?? null) : null;
  }

  /**
   * Obter dia do almanaque por mês e dia
   * @param mes 1-12
   * @param dia 1-31
   * @returns AlmanaqueDia ou null
   */
  obterPorMesDia(mes: number, dia: number): AlmanaqueDia | null {
    const chave = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return this.data[chave] ?? null;
  }

  /**
   * Extrair chave MM-DD de um input Date ou string
   */
  private extrairChaveMD(data: Date | string): string | null {
    if (typeof data === 'string') {
      // Se já é "MM-DD", devolver direto
      if (/^\d{2}-\d{2}$/.test(data)) {
        return data;
      }
      // Se é "YYYY-MM-DD", extrair "MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data.substring(5); // "YYYY-MM-DD" → "MM-DD"
      }
      return null;
    }

    // Se é Date, formatar para MM-DD
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${mes}-${dia}`;
  }

  /**
   * Obter todos os dias do mês
   * @param mes 1-12
   * @returns Array de AlmanaqueDia
   */
  obterMes(mes: number): AlmanaqueDia[] {
    const mesPad = String(mes).padStart(2, '0');
    return Object.entries(this.data)
      .filter(([chave]) => chave.startsWith(mesPad))
      .map(([, dia]) => dia);
  }

  /**
   * Obter estatísticas do almanaque
   */
  obterEstatisticas(): {
    totalDias: number;
    diasComProverbio: number;
    diasComAstronomia: number;
  } {
    const dias = Object.values(this.data);
    return {
      totalDias: dias.length,
      diasComProverbio: dias.filter(d => d.proverbio).length,
      diasComAstronomia: dias.filter(d => d.astronomia).length,
    };
  }
}

// Instância singleton do loader
const loaderInstance = new AlmanaqueDiarioLoader(almanaque as AlmanaqueDiarioType);

/**
 * Hook: useAlmanaque
 * Obter dados do almanaque para uma data específica
 */
export function useAlmanaque(data?: Date | string) {
  return useMemo(() => {
    if (!data) {
      // Se sem data, retornar hoje
      data = new Date();
    }
    return loaderInstance.obterPorData(data);
  }, [data]);
}

/**
 * Hook: useAlmanaqueMes
 * Obter todos os dias de um mês
 */
export function useAlmanaqueMes(mes: number) {
  return useMemo(() => {
    return loaderInstance.obterMes(mes);
  }, [mes]);
}

/**
 * Hook: useAlmanaqueHoje
 * Obter dados do almanaque para hoje
 */
export function useAlmanaqueHoje() {
  const hoje = new Date();
  return useAlmanaque(hoje);
}

/**
 * Função: obterAlmanaque
 * Usar fora de componentes React (SSR, ações server)
 */
export function obterAlmanaque(data: Date | string): AlmanaqueDia | null {
  return loaderInstance.obterPorData(data);
}

/**
 * Função: obterAlmanaqueMesDia
 * Usar fora de componentes React
 */
export function obterAlmanaqueMesDia(mes: number, dia: number): AlmanaqueDia | null {
  return loaderInstance.obterPorMesDia(mes, dia);
}

export default loaderInstance;
