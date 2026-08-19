/**
 * Tipos para o Almanaque Diário
 * Projeto: O Tio do Joca
 * Módulo: Calendário Lunar
 *
 * Os campos são arrays de strings e os nomes seguem o JSON gerado por
 * scripts/gerar-almanaque.mjs (fonte de verdade).
 */

export interface AlmanaqueDia {
  santo?: string[];
  efemerides?: string[];
  proverbio?: string[];
  agricultura?: string[];
  hortaJardim?: string[];
  natureza?: string[];
  astronomia?: string[];
  curiosidade?: string[];
}

export type AlmanaqueDiarioType = Record<string, AlmanaqueDia>;

export interface IAlmanaqueDiarioLoader {
  obterPorData(data: Date | string): AlmanaqueDia | null;
  obterPorMesDia(mes: number, dia: number): AlmanaqueDia | null;
}
