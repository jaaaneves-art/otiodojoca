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
import { criarReservaAlojamento } from './actions';

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
