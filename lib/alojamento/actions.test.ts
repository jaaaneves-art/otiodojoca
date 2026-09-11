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
import {
  criarReservaAlojamento,
  calcularPrecoReserva,
  atualizarStatusReserva,
  cancelarReserva,
} from './actions';

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
};

/**
 * Mock mínimo do cliente Supabase para criarReservaAlojamento() —
 * REESCRITO: a função já não faz nenhuma validação em JS (sessão, datas,
 * disponibilidade, preço) nem insere diretamente em reservas_alojamento.
 * Passa tudo, tal e qual, para a RPC criar_reserva_alojamento(), que corre
 * no Postgres como SECURITY DEFINER e resolve o utilizador com auth.uid()
 * — por isso a assinatura da função nem aceita um id de utilizador vindo
 * do cliente. Ver
 * supabase/migrations/20260911153000_reserva_alojamento_rpc_transacional.sql
 * e os testes pgTAP em
 * supabase/tests/database/20260911153001_testes_reserva_alojamento_rpc.test.sql
 * (esses sim correm contra Postgres a sério; estes aqui só verificam que
 * o wrapper em JS chama a RPC certa e propaga o resultado/erro).
 */
function mockSupabaseRpc({
  rpcData = { id: 1, status: 'pendente' } as unknown,
  rpcError = null as { message: string } | null,
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: rpcData, error: rpcError });
  return { rpc };
}

describe('criarReservaAlojamento', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it('rejeita se não houver sessão iniciada (erro devolvido pela RPC)', async () => {
    const supabase = mockSupabaseRpc({
      rpcData: null,
      rpcError: { message: 'É preciso iniciar sessão para fazer uma reserva.' },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(criarReservaAlojamento(DADOS_VALIDOS)).rejects.toThrow(
      'É preciso iniciar sessão para fazer uma reserva.'
    );
  });

  it('rejeita se a data de saída não for depois da data de entrada (erro devolvido pela RPC)', async () => {
    const supabase = mockSupabaseRpc({
      rpcData: null,
      rpcError: { message: 'Data de saída deve ser após data de entrada' },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(
      criarReservaAlojamento({
        ...DADOS_VALIDOS,
        data_entrada: '2026-09-12',
        data_saida: '2026-09-10',
      })
    ).rejects.toThrow('Data de saída deve ser após data de entrada');
  });

  it('chama a RPC certa, sem nenhum campo de identidade vindo do cliente', async () => {
    const supabase = mockSupabaseRpc();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await criarReservaAlojamento(DADOS_VALIDOS);

    expect(supabase.rpc).toHaveBeenCalledWith(
      'criar_reserva_alojamento',
      expect.objectContaining({
        p_alojamento_id: DADOS_VALIDOS.alojamento_id,
        p_nome_hospede: DADOS_VALIDOS.nome_hospede,
        p_email_hospede: DADOS_VALIDOS.email_hospede,
        p_data_entrada: DADOS_VALIDOS.data_entrada,
        p_data_saida: DADOS_VALIDOS.data_saida,
        p_num_pessoas: DADOS_VALIDOS.num_pessoas,
        p_num_quartos: DADOS_VALIDOS.num_quartos,
        p_tipo_refeicao: DADOS_VALIDOS.tipo_refeicao,
      })
    );

    // O utilizador é sempre resolvido dentro da RPC via auth.uid() — a
    // assinatura de criarReservaAlojamento() nem tem onde receber um id
    // vindo do cliente, mas isto protege também contra um futuro refactor
    // que volte a acrescentar esse campo.
    const argumentosRpc = supabase.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(argumentosRpc).not.toHaveProperty('user_id');
    expect(argumentosRpc).not.toHaveProperty('p_user_id');
  });

  it('propaga o erro devolvido pela RPC (ex: RLS/validação a bloquear a reserva)', async () => {
    const supabase = mockSupabaseRpc({
      rpcData: null,
      rpcError: { message: 'Sem disponibilidade para as datas escolhidas.' },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(criarReservaAlojamento(DADOS_VALIDOS)).rejects.toThrow(
      'Sem disponibilidade para as datas escolhidas.'
    );
  });

  it('devolve a reserva criada quando tudo corre bem', async () => {
    const reservaCriada = { id: 42, status: 'pendente' };
    const supabase = mockSupabaseRpc({ rpcData: reservaCriada });
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

/**
 * Mock do cliente Supabase para atualizarStatusReserva()/cancelarReserva()
 * — cobrem o guard verificarPermissaoReserva() acrescentado em 2026-08-27
 * (dono ou staff, com mensagem clara em vez de depender só da RLS — ver
 * docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md, secção 14).
 * "reservas_alojamento" precisa de suportar select() (a verificação de
 * permissão) e update() (a alteração em si) a partir do mesmo from().
 */
function mockSupabaseParaGestaoReserva({
  user = { id: 'user-dono' } as { id: string } | null,
  reservaExiste = true,
  reservaUserId = 'user-dono',
  profileRole = 'user' as string | undefined,
  updateData = { id: 1, status: 'confirmada' } as unknown,
  updateError = null as { message: string } | null,
} = {}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: updateData, error: updateError }),
      }),
    }),
  });

  const selectReserva = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: reservaExiste ? { user_id: reservaUserId } : null,
      }),
    }),
  });

  const selectProfile = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: profileRole ? { role: profileRole } : null }),
    }),
  });

  const from = vi.fn((table: string) => {
    if (table === 'reservas_alojamento') return { select: selectReserva, update };
    if (table === 'profiles') return { select: selectProfile };
    throw new Error(`mockSupabaseParaGestaoReserva: tabela "${table}" não configurada neste teste`);
  });

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
    _update: update,
  };
}

describe('atualizarStatusReserva / cancelarReserva — verificarPermissaoReserva', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it('rejeita sem sessão iniciada', async () => {
    const supabase = mockSupabaseParaGestaoReserva({ user: null });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(atualizarStatusReserva(1, 'confirmada')).rejects.toThrow(
      'É preciso iniciar sessão.'
    );
    expect(supabase._update).not.toHaveBeenCalled();
  });

  it('rejeita se a reserva não existir (ou a RLS de SELECT já a esconder)', async () => {
    const supabase = mockSupabaseParaGestaoReserva({ reservaExiste: false });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(atualizarStatusReserva(1, 'confirmada')).rejects.toThrow(
      'Reserva não encontrada.'
    );
    expect(supabase._update).not.toHaveBeenCalled();
  });

  it('rejeita quem não é dono nem staff', async () => {
    const supabase = mockSupabaseParaGestaoReserva({
      user: { id: 'user-intruso' },
      reservaUserId: 'user-dono',
      profileRole: 'user',
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(atualizarStatusReserva(1, 'confirmada')).rejects.toThrow(
      'Não tens permissão para gerir esta reserva.'
    );
    expect(supabase._update).not.toHaveBeenCalled();
  });

  it('permite ao dono atualizar a própria reserva', async () => {
    const supabase = mockSupabaseParaGestaoReserva({
      user: { id: 'user-dono' },
      reservaUserId: 'user-dono',
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await atualizarStatusReserva(1, 'confirmada');

    expect(supabase._update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmada' })
    );
  });

  it('permite a staff (moderator/admin) gerir uma reserva que não é sua', async () => {
    const supabase = mockSupabaseParaGestaoReserva({
      user: { id: 'user-staff' },
      reservaUserId: 'outro-utilizador',
      profileRole: 'moderator',
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await atualizarStatusReserva(1, 'concluido');

    expect(supabase._update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'concluido' })
    );
  });

  it('cancelarReserva aplica o mesmo guard e grava o motivo', async () => {
    const supabase = mockSupabaseParaGestaoReserva({
      user: { id: 'user-dono' },
      reservaUserId: 'user-dono',
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await cancelarReserva(1, 'Mudança de planos');

    expect(supabase._update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelada', observacoes: 'Mudança de planos' })
    );
  });

  it('cancelarReserva também rejeita quem não é dono nem staff', async () => {
    const supabase = mockSupabaseParaGestaoReserva({
      user: { id: 'user-intruso' },
      reservaUserId: 'user-dono',
      profileRole: 'user',
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    await expect(cancelarReserva(1)).rejects.toThrow(
      'Não tens permissão para gerir esta reserva.'
    );
    expect(supabase._update).not.toHaveBeenCalled();
  });
});
