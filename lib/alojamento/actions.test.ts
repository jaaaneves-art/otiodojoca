// lib/alojamento/actions.test.ts
//
// Primeiro teste automatizado do projeto. Cobre criarReservaAlojamento(),
// escolhida por proteger a correção de segurança RISCO-02 (RLS aberta em
// reservas_alojamento — ver docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md)
// contra regressão: se alguém no futuro voltar a deixar o user_id vir do
// cliente em vez do utilizador autenticado, estes testes falham.
//
// Não toca nenhuma base de dados real — @/lib/supabase/server é mockado.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { criarReservaAlojamento, calcularPrecoReserva } from './actions';

const DADOS_VALIDOS = {
  alojamento_id: 1,
  nome_hospede: 'Ana Teste',
  email_hospede: 'ana@example.com',
  telefone_hospede: '912345678',
  data_entrada: '2026-09-10',
  data_saida: '2026-09-12',
  num_pessoas: 2,
  num_quartos: 1,
  tipo_refeicao: 'sem_refeicoes' as const,
  preco_total: 120,
};

/**
 * Mock mínimo do cliente Supabase — só a cadeia de métodos que
 * criarReservaAlojamento() efetivamente usa (auth.getUser + from().insert().select().single()).
 */
function mockSupabase({
  user = { id: 'user-123' } as { id: string } | null,
  insertData = { id: 1, status: 'pendente' } as unknown,
  insertError = null as { message: string } | null,
} = {}) {
  const single = vi.fn().mockResolvedValue({ data: insertData, error: insertError });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
    _insert: insert, // exposto para os testes verificarem os argumentos do insert
  };
}

describe('criarReservaAlojamento', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it('rejeita se não houver sessão iniciada', async () => {
    const supabase = mockSupabase({ user: null });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(criarReservaAlojamento(DADOS_VALIDOS)).rejects.toThrow(
      'É preciso iniciar sessão para fazer uma reserva.'
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('rejeita se a data de saída não for depois da data de entrada', async () => {
    const supabase = mockSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(
      criarReservaAlojamento({
        ...DADOS_VALIDOS,
        data_entrada: '2026-09-12',
        data_saida: '2026-09-10',
      })
    ).rejects.toThrow('Data de saída deve ser após data de entrada');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('liga a reserva ao utilizador autenticado, nunca a um user_id vindo do cliente', async () => {
    const supabase = mockSupabase({ user: { id: 'user-abc' } });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await criarReservaAlojamento(DADOS_VALIDOS);

    expect(supabase._insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: 'user-abc', status: 'pendente' }),
    ]);
  });

  it('propaga o erro do Supabase (ex: RLS a bloquear o insert)', async () => {
    const supabase = mockSupabase({
      insertData: null,
      insertError: { message: 'new row violates row-level security policy' },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(criarReservaAlojamento(DADOS_VALIDOS)).rejects.toThrow(
      'Erro ao criar reserva: new row violates row-level security policy'
    );
  });

  it('devolve a reserva criada quando tudo corre bem', async () => {
    const reservaCriada = { id: 42, status: 'pendente' };
    const supabase = mockSupabase({ insertData: reservaCriada });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const resultado = await criarReservaAlojamento(DADOS_VALIDOS);

    expect(resultado).toEqual(reservaCriada);
  });
});

/**
 * Mock do cliente Supabase para calcularPrecoReserva() — que por baixo
 * chama obterAlojamento() (tabelas "alojamentos" + "localizacoes") e,
 * quando há refeições, obterRefeicoesAlojamento() ("refeicoes_alojamento").
 * Dispatch por nome de tabela, porque calcularPrecoReserva() atravessa as
 * três.
 */
function mockSupabaseParaPreco({
  alojamento = { id: 1, localizacao_id: 1, preco_noite: 50 } as { localizacao_id: number; preco_noite: number },
  localizacao = { id: 1 } as unknown,
  refeicoes = [] as Array<{ tipo_refeicao: string; preco_extra: number }>,
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === 'alojamentos') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: alojamento, error: null }) }) }) };
    }
    if (table === 'localizacoes') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: localizacao, error: null }) }) }) };
    }
    if (table === 'refeicoes_alojamento') {
      return { select: () => ({ eq: () => Promise.resolve({ data: refeicoes, error: null }) }) };
    }
    throw new Error(`mockSupabaseParaPreco: tabela "${table}" não configurada neste teste`);
  });

  return { from };
}

describe('calcularPrecoReserva', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it('calcula noites x preço/noite, sem refeições', async () => {
    const supabase = mockSupabaseParaPreco({ alojamento: { localizacao_id: 1, preco_noite: 50 } });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const resultado = await calcularPrecoReserva(1, '2026-09-10', '2026-09-13', 'sem_refeicoes');

    expect(resultado).toEqual({
      numNoites: 3,
      precoNoite: 50,
      precoRefeicoes: 0,
      precoTotal: 150,
    });
  });

  it('rejeita se a data de saída não for depois da entrada (0 ou menos noites)', async () => {
    const supabase = mockSupabaseParaPreco();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(
      calcularPrecoReserva(1, '2026-09-10', '2026-09-10', 'sem_refeicoes')
    ).rejects.toThrow('Número de noites deve ser maior que zero');
  });

  it('soma o pequeno-almoço por noite quando pedido', async () => {
    const supabase = mockSupabaseParaPreco({
      alojamento: { localizacao_id: 1, preco_noite: 50 },
      refeicoes: [{ tipo_refeicao: 'pequeno_almoco', preco_extra: 5 }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const resultado = await calcularPrecoReserva(1, '2026-09-10', '2026-09-13', 'pequeno_almoco');

    // 3 noites x (50 + 5)
    expect(resultado.precoRefeicoes).toBe(15);
    expect(resultado.precoTotal).toBe(165);
  });

  it('meia pensão soma só o almoço; pensão completa soma almoço + jantar', async () => {
    const refeicoes = [
      { tipo_refeicao: 'almoço', preco_extra: 10 },
      { tipo_refeicao: 'jantar', preco_extra: 12 },
    ];

    const supabaseMeiaPensao = mockSupabaseParaPreco({
      alojamento: { localizacao_id: 1, preco_noite: 50 },
      refeicoes,
    });
    vi.mocked(createClient).mockResolvedValue(supabaseMeiaPensao as any);
    const meiaPensao = await calcularPrecoReserva(1, '2026-09-10', '2026-09-12', 'meia_pensao');
    // 2 noites x 10 (só almoço)
    expect(meiaPensao.precoRefeicoes).toBe(20);

    const supabasePensaoCompleta = mockSupabaseParaPreco({
      alojamento: { localizacao_id: 1, preco_noite: 50 },
      refeicoes,
    });
    vi.mocked(createClient).mockResolvedValue(supabasePensaoCompleta as any);
    const pensaoCompleta = await calcularPrecoReserva(1, '2026-09-10', '2026-09-12', 'pensao_completa');
    // 2 noites x (10 + 12)
    expect(pensaoCompleta.precoRefeicoes).toBe(44);
  });

  it('não soma nada se a refeição pedida não tiver preco_extra configurado (sem rebentar)', async () => {
    const supabase = mockSupabaseParaPreco({
      alojamento: { localizacao_id: 1, preco_noite: 50 },
      refeicoes: [], // nenhuma refeição configurada para este alojamento
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const resultado = await calcularPrecoReserva(1, '2026-09-10', '2026-09-11', 'pensao_completa');

    expect(resultado.precoRefeicoes).toBe(0);
    expect(resultado.precoTotal).toBe(50);
  });

  it('arredonda o preço total a 2 casas decimais', async () => {
    const supabase = mockSupabaseParaPreco({ alojamento: { localizacao_id: 1, preco_noite: 33.333 } });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const resultado = await calcularPrecoReserva(1, '2026-09-10', '2026-09-11', 'sem_refeicoes');

    // 1 noite x 33.333 = 33.333 -> arredondado a 33.33
    expect(resultado.precoTotal).toBe(33.33);
  });
});
