/**
 * Tipos para o Almanaque Diário
 * Projeto: O Tio do Joca
 * Módulo: Calendário Lunar
 */

export interface AlmanaqueDia {
  /** Santo ou celebração do dia */
  santo_do_dia?: string;
  
  /** Efemérides históricas ou astronômicas */
  efemerides?: string;
  
  /** Provérbio português tradicional */
  proverbio?: string;
  
  /** Atividades agrícolas recomendadas */
  agricultura?: string;
  
  /** Tarefas de horta e jardim */
  horta_e_jardim?: string;
  
  /** Observações sobre natureza, fauna, flora */
  natureza?: string;
  
  /** Dados astronômicos e eventos celestes */
  astronomia?: string;
  
  /** Curiosidade histórica, cultural ou científica */
  curiosidade?: string;
}

export type AlmanaqueDiarioType = Record<string, AlmanaqueDia>;

/**
 * Formato de chave: "MM-DD" (ex: "01-01", "12-25")
 * String: data no formato "YYYY-MM-DD" ou "MM-DD"
 * Returns: AlmanaqueDia | null se não encontrado
 */
export interface IAlmanaqueDiarioLoader {
  obterPorData(data: Date | string): AlmanaqueDia | null;
  obterPorMesDia(mes: number, dia: number): AlmanaqueDia | null;
}
