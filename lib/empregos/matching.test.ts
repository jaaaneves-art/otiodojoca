// lib/empregos/matching.test.ts
//
// Testa o motor de matching por regras da Fase 7 (docs/EMPREGOS.md secção
// 5 e 13). Função pura, sem I/O nem Supabase, por isso não precisa de
// nenhum mock — só verifica que cada regra dá o resultado esperado e que
// a média ponderada final é calculada corretamente sobre os componentes
// aplicáveis.

import { describe, it, expect } from 'vitest';
import { calcularMatch, PESOS_MATCH } from './matching';

describe('calcularMatch', () => {
  it('dá 100 quando tudo coincide (competências, município, experiência e formação acima do pedido)', () => {
    const job = { nivel_experiencia: 'pleno', nivel_formacao_minimo: 'licenciatura', municipio_id: 1, modalidade: 'presencial' };
    const jobSkills = [
      { skill_id: 1, obrigatoria: true, nome: 'Excel' },
      { skill_id: 2, obrigatoria: false, nome: 'Inglês' },
    ];
    const candidate = { nivel_experiencia: 'senior', nivel_formacao: 'mestrado', municipio_id: 1, disponivel_mudanca_residencia: false };
    const candidateSkills = [{ skill_id: 1 }, { skill_id: 2 }];

    const r = calcularMatch(job, jobSkills, candidate, candidateSkills, new Map());

    expect(r.score).toBe(100);
    expect(r.competencias.competenciasEmFalta).toEqual([]);
  });

  it('assinala competências obrigatórias em falta e pondera-as no dobro das desejáveis', () => {
    const job = { nivel_experiencia: null, nivel_formacao_minimo: null, municipio_id: 1, modalidade: 'remoto' };
    const jobSkills = [
      { skill_id: 1, obrigatoria: true, nome: 'Excel' },
      { skill_id: 2, obrigatoria: true, nome: 'Python' },
    ];
    const candidate = { nivel_experiencia: null, nivel_formacao: null, municipio_id: null, disponivel_mudanca_residencia: false };

    const r = calcularMatch(job, jobSkills, candidate, [{ skill_id: 1 }], new Map());

    // competencias: 2/4 peso obtido (só uma das duas obrigatórias) = 50
    expect(r.competencias.score).toBe(50);
    expect(r.competencias.competenciasEmFalta).toEqual(['Python']);
    // vaga remota ignora localização por completo
    expect(r.localizacao.score).toBe(100);
    expect(r.localizacao.aplicavel).toBe(true);
    // sem exigência de experiência/formação => trivialmente cumpridas
    expect(r.experiencia.score).toBe(100);
    expect(r.formacao.score).toBe(100);
    // média ponderada: 0.4*50 + 0.2*100 + 0.25*100 + 0.15*100 = 80
    expect(r.score).toBe(80);
  });

  it('exclui componentes não aplicáveis da média em vez de os penalizar', () => {
    const job = { nivel_experiencia: 'junior', nivel_formacao_minimo: 'sem_requisito', municipio_id: 5, modalidade: 'presencial' };
    const candidate = { nivel_experiencia: 'junior', nivel_formacao: null, municipio_id: null, disponivel_mudanca_residencia: false };

    const r = calcularMatch(job, [], candidate, [], new Map());

    expect(r.competencias.aplicavel).toBe(false); // vaga não pediu nenhuma
    expect(r.localizacao.aplicavel).toBe(false); // candidato sem município no perfil
    // só restam experiência (100) e formação (100), ambas a 100% => média final 100
    expect(r.score).toBe(100);
  });

  it('calcula a distância real entre municípios (Haversine) e aplica os escalões de score', () => {
    const job = { nivel_experiencia: null, nivel_formacao_minimo: null, municipio_id: 1, modalidade: 'presencial' };
    const candidate = { nivel_experiencia: null, nivel_formacao: null, municipio_id: 2, disponivel_mudanca_residencia: false };
    const municipios = new Map([
      [1, { latitude: 38.7223, longitude: -9.1393 }], // Lisboa
      [2, { latitude: 41.1579, longitude: -8.6291 }], // Porto
    ]);

    const r = calcularMatch(job, [], candidate, [], municipios);

    expect(r.localizacao.distanciaKm).toBeGreaterThan(250);
    expect(r.localizacao.distanciaKm).toBeLessThan(300);
    expect(r.localizacao.score).toBe(0); // acima do maior escalão (250km)
  });

  it('estabelece um piso de 60 no score de localização quando o candidato aceita mudar de residência', () => {
    const job = { nivel_experiencia: null, nivel_formacao_minimo: null, municipio_id: 1, modalidade: 'presencial' };
    const candidate = { nivel_experiencia: null, nivel_formacao: null, municipio_id: 2, disponivel_mudanca_residencia: true };
    const municipios = new Map([
      [1, { latitude: 38.7223, longitude: -9.1393 }],
      [2, { latitude: 41.1579, longitude: -8.6291 }],
    ]);

    const r = calcularMatch(job, [], candidate, [], municipios);

    expect(r.localizacao.score).toBe(60);
  });

  it('penaliza gradualmente experiência/formação abaixo do pedido, nunca a zero', () => {
    const job = { nivel_experiencia: 'especialista', nivel_formacao_minimo: 'doutoramento', municipio_id: 1, modalidade: 'remoto' };
    const candidate = { nivel_experiencia: 'sem_experiencia', nivel_formacao: 'ensino_basico', municipio_id: null, disponivel_mudanca_residencia: false };

    const r = calcularMatch(job, [], candidate, [], new Map());

    // gap máximo (4 níveis) em ambos => pior escalão da tabela, mas nunca 0
    expect(r.experiencia.score).toBeGreaterThan(0);
    expect(r.experiencia.score).toBeLessThan(50);
    expect(r.formacao.score).toBeGreaterThan(0);
    expect(r.formacao.score).toBeLessThan(50);
  });

  it('trata "outro" nível de formação do candidato como incerto (score neutro), não como reprovação', () => {
    const job = { nivel_experiencia: null, nivel_formacao_minimo: 'licenciatura', municipio_id: 1, modalidade: 'remoto' };
    const candidate = { nivel_experiencia: null, nivel_formacao: 'outro', municipio_id: null, disponivel_mudanca_residencia: false };

    const r = calcularMatch(job, [], candidate, [], new Map());

    expect(r.formacao.score).toBe(50);
  });

  it('os pesos dos componentes somam 1', () => {
    const soma = Object.values(PESOS_MATCH).reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(1);
  });
});
