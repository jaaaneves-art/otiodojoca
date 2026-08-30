// Motor de matching candidato <-> vaga do módulo Empregos (Fase 7).
//
// Deliberadamente baseado em regras simples e determinísticas -- nada de
// "score de IA" opaco (ver docs/EMPREGOS.md secção 5). Cada componente é
// calculado de forma isolada e explicável, o resultado mostra sempre a
// decomposição (nunca só o número final) e assinala requisitos em falta.
//
// Ficheiro puro (sem "use client"/"use server", sem dependência de
// Supabase) para poder ser chamado tanto de Server Components como,
// no futuro, de testes automatizados -- recebe sempre dados já
// carregados, nunca faz I/O.

// ------------------------------------------------------------
// Tipos de entrada
// ------------------------------------------------------------

export interface MatchJobInput {
  nivel_experiencia: string | null;
  nivel_formacao_minimo: string | null;
  municipio_id: number | null;
  modalidade: string;
}

export interface MatchJobSkillInput {
  skill_id: number;
  obrigatoria: boolean;
  /** Opcional -- só usado para mensagens legíveis de competências em falta. */
  nome?: string;
}

export interface MatchCandidateInput {
  nivel_experiencia: string | null;
  nivel_formacao: string | null;
  municipio_id: number | null;
  disponivel_mudanca_residencia: boolean;
}

export interface MatchCandidateSkillInput {
  skill_id: number;
}

export interface MunicipioCoord {
  latitude: number | null;
  longitude: number | null;
}

// ------------------------------------------------------------
// Tipos de saída
// ------------------------------------------------------------

export interface MatchComponentResult {
  /** false quando não há dados suficientes para calcular este componente
   *  (ex: candidato sem município definido) -- nesse caso é excluído da
   *  média ponderada em vez de penalizar ou beneficiar artificialmente. */
  aplicavel: boolean;
  /** 0-100, ou null quando aplicavel = false. */
  score: number | null;
  /** Frase curta explicando o score, sempre em português simples. */
  detalhe: string;
}

export interface MatchResult {
  /** Média ponderada dos componentes aplicáveis (secção "Pesos" abaixo),
   *  renormalizada sobre o peso só dos componentes aplicáveis. null
   *  quando nenhum componente é aplicável (não deve acontecer em
   *  condições normais, já que experiência/formação são sempre
   *  aplicáveis). */
  score: number | null;
  competencias: MatchComponentResult & { competenciasEmFalta: string[] };
  localizacao: MatchComponentResult & { distanciaKm: number | null };
  experiencia: MatchComponentResult;
  formacao: MatchComponentResult;
}

// ------------------------------------------------------------
// Pesos de cada componente na média final (somam 1). Documentados aqui
// porque são a única coisa "arbitrária" do motor -- o resto são
// comparações diretas de dados.
// ------------------------------------------------------------

export const PESOS_MATCH = {
  competencias: 0.4,
  localizacao: 0.2,
  experiencia: 0.25,
  formacao: 0.15,
} as const;

// ------------------------------------------------------------
// Competências: sobreposição ponderada (obrigatórias pesam o dobro das
// desejáveis) entre o que a vaga pede e o que o candidato tem no catálogo
// partilhado `skills`.
// ------------------------------------------------------------

function calcularCompetencias(
  jobSkills: MatchJobSkillInput[],
  candidateSkillIds: Set<number>
): MatchComponentResult & { competenciasEmFalta: string[] } {
  if (jobSkills.length === 0) {
    return {
      aplicavel: false,
      score: null,
      detalhe: "A vaga não especificou competências pedidas.",
      competenciasEmFalta: [],
    };
  }

  const pesoTotal = jobSkills.reduce((acc, s) => acc + (s.obrigatoria ? 2 : 1), 0);
  let pesoObtido = 0;
  const emFalta: string[] = [];

  for (const s of jobSkills) {
    const tem = candidateSkillIds.has(s.skill_id);
    if (tem) {
      pesoObtido += s.obrigatoria ? 2 : 1;
    } else if (s.obrigatoria) {
      emFalta.push(s.nome ?? `competência #${s.skill_id}`);
    }
  }

  const score = Math.round((pesoObtido / pesoTotal) * 100);
  const detalhe =
    emFalta.length > 0
      ? `Faltam ${emFalta.length} competência${emFalta.length > 1 ? "s" : ""} obrigatória${emFalta.length > 1 ? "s" : ""} no teu perfil.`
      : "Cumpres todas as competências obrigatórias pedidas.";

  return { aplicavel: true, score, detalhe, competenciasEmFalta: emFalta };
}

// ------------------------------------------------------------
// Localização: distância real (fórmula de Haversine, não é "IA", é
// geometria) entre o município do candidato e o da vaga, convertida em
// score por escalões -- vagas remotas ignoram localização por completo,
// e disponibilidade para mudar de residência estabelece um piso mínimo.
// ------------------------------------------------------------

function distanciaEmKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // raio médio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scorePorDistancia(km: number): number {
  if (km <= 5) return 100;
  if (km <= 15) return 90;
  if (km <= 30) return 75;
  if (km <= 60) return 55;
  if (km <= 120) return 30;
  if (km <= 250) return 10;
  return 0;
}

function calcularLocalizacao(
  job: MatchJobInput,
  candidate: MatchCandidateInput,
  municipiosPorId: Map<number, MunicipioCoord>
): MatchComponentResult & { distanciaKm: number | null } {
  if (job.modalidade === "remoto") {
    return {
      aplicavel: true,
      score: 100,
      detalhe: "Vaga remota -- a localização não é fator de compatibilidade.",
      distanciaKm: null,
    };
  }

  if (!candidate.municipio_id || !job.municipio_id) {
    return {
      aplicavel: false,
      score: null,
      detalhe: "Indica o teu município no perfil de candidato para veres a distância a esta vaga.",
      distanciaKm: null,
    };
  }

  if (candidate.municipio_id === job.municipio_id) {
    return { aplicavel: true, score: 100, detalhe: "Vives no mesmo município da vaga.", distanciaKm: 0 };
  }

  const candMun = municipiosPorId.get(candidate.municipio_id);
  const jobMun = municipiosPorId.get(job.municipio_id);

  if (
    !candMun?.latitude ||
    !candMun?.longitude ||
    !jobMun?.latitude ||
    !jobMun?.longitude
  ) {
    return {
      aplicavel: false,
      score: null,
      detalhe: "Sem coordenadas suficientes para calcular a distância.",
      distanciaKm: null,
    };
  }

  const km = distanciaEmKm(candMun.latitude, candMun.longitude, jobMun.latitude, jobMun.longitude);
  let score = scorePorDistancia(km);

  // Quem se disponibiliza a mudar de residência não deve ficar penalizado
  // pela distância abaixo de um piso razoável.
  if (candidate.disponivel_mudanca_residencia) {
    score = Math.max(score, 60);
  }

  return {
    aplicavel: true,
    score,
    detalhe: `Distância aproximada: ${Math.round(km)} km.`,
    distanciaKm: Math.round(km),
  };
}

// ------------------------------------------------------------
// Experiência e formação: comparação de nível numa escala ordenada.
// Sem exigência da vaga = componente trivialmente cumprido (100). Sem
// resposta do candidato = incerteza, score neutro (50). Candidato abaixo
// do pedido = score decresce com o "gap" entre níveis.
// ------------------------------------------------------------

const ORDEM_EXPERIENCIA: Record<string, number> = {
  sem_experiencia: 0,
  junior: 1,
  pleno: 2,
  senior: 3,
  especialista: 4,
};

const ORDEM_FORMACAO: Record<string, number> = {
  ensino_basico: 0,
  ensino_secundario: 1,
  licenciatura: 2,
  mestrado: 3,
  doutoramento: 4,
};

const SCORE_POR_GAP = [100, 65, 40, 20, 10];

function scorePorGap(gap: number): number {
  return SCORE_POR_GAP[Math.min(gap, SCORE_POR_GAP.length - 1)];
}

function calcularExperiencia(
  job: MatchJobInput,
  candidate: MatchCandidateInput
): MatchComponentResult {
  if (!job.nivel_experiencia) {
    return { aplicavel: true, score: 100, detalhe: "A vaga não exige um nível de experiência específico." };
  }
  if (!candidate.nivel_experiencia) {
    return {
      aplicavel: true,
      score: 50,
      detalhe: "Ainda não indicaste o teu nível de experiência no perfil.",
    };
  }

  const pedido = ORDEM_EXPERIENCIA[job.nivel_experiencia];
  const teu = ORDEM_EXPERIENCIA[candidate.nivel_experiencia];

  if (pedido == null || teu == null) {
    return { aplicavel: true, score: 50, detalhe: "Não foi possível comparar os níveis de experiência." };
  }
  if (teu >= pedido) {
    return { aplicavel: true, score: 100, detalhe: "O teu nível de experiência cumpre o pedido." };
  }
  return {
    aplicavel: true,
    score: scorePorGap(pedido - teu),
    detalhe: "A vaga pede um nível de experiência acima do que indicaste.",
  };
}

function calcularFormacao(job: MatchJobInput, candidate: MatchCandidateInput): MatchComponentResult {
  if (!job.nivel_formacao_minimo || job.nivel_formacao_minimo === "sem_requisito") {
    return { aplicavel: true, score: 100, detalhe: "A vaga não exige um nível de formação mínimo." };
  }
  if (!candidate.nivel_formacao) {
    return { aplicavel: true, score: 50, detalhe: "Ainda não indicaste o teu nível de formação no perfil." };
  }
  if (candidate.nivel_formacao === "outro") {
    return {
      aplicavel: true,
      score: 50,
      detalhe: "Indicaste um nível de formação não diretamente comparável (\"Outro\").",
    };
  }

  const pedido = ORDEM_FORMACAO[job.nivel_formacao_minimo];
  const teu = ORDEM_FORMACAO[candidate.nivel_formacao];

  if (pedido == null || teu == null) {
    return { aplicavel: true, score: 50, detalhe: "Não foi possível comparar os níveis de formação." };
  }
  if (teu >= pedido) {
    return { aplicavel: true, score: 100, detalhe: "A tua formação cumpre o requisito mínimo." };
  }
  return {
    aplicavel: true,
    score: scorePorGap(pedido - teu),
    detalhe: "A vaga pede um nível de formação acima do que indicaste.",
  };
}

// ------------------------------------------------------------
// Função principal
// ------------------------------------------------------------

export function calcularMatch(
  job: MatchJobInput,
  jobSkills: MatchJobSkillInput[],
  candidate: MatchCandidateInput,
  candidateSkills: MatchCandidateSkillInput[],
  municipiosPorId: Map<number, MunicipioCoord>
): MatchResult {
  const candidateSkillIds = new Set(candidateSkills.map((s) => s.skill_id));

  const competencias = calcularCompetencias(jobSkills, candidateSkillIds);
  const localizacao = calcularLocalizacao(job, candidate, municipiosPorId);
  const experiencia = calcularExperiencia(job, candidate);
  const formacao = calcularFormacao(job, candidate);

  const componentes = [
    { peso: PESOS_MATCH.competencias, resultado: competencias },
    { peso: PESOS_MATCH.localizacao, resultado: localizacao },
    { peso: PESOS_MATCH.experiencia, resultado: experiencia },
    { peso: PESOS_MATCH.formacao, resultado: formacao },
  ].filter((c) => c.resultado.aplicavel && c.resultado.score !== null);

  const pesoTotal = componentes.reduce((acc, c) => acc + c.peso, 0);
  const score =
    pesoTotal > 0
      ? Math.round(
          componentes.reduce((acc, c) => acc + c.peso * (c.resultado.score as number), 0) / pesoTotal
        )
      : null;

  return { score, competencias, localizacao, experiencia, formacao };
}
