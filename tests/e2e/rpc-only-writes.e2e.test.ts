import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Substitui supabase/tests/security/rls-policies-block.test.sql (removido —
// usava `EXCEPTION WHEN others THEN RAISE NOTICE 'PASS'`, que dava verde a
// qualquer erro, incluindo uma função rebentada; foi este padrão que
// escondeu o bug do e_menor_agora()). Mesmo molde de
// tests/e2e/social-complete.e2e.test.ts: BD real, sessão de utilizador real
// (anon key + JWT), cliente admin só para setup/teardown.
//
// Cobre o "RPC-only writes" fechado a 13 Set em jobs, marketplace_ads,
// restaurante_reservas e reservas_alojamento (ver
// docs/planos/20260913T0945-plano-sessao.md, secção "P0 NOVO"): confirma
// que cada RPC funciona de ponta a ponta E que a escrita direta na tabela
// continua bloqueada (código 42501 — insufficient_privilege, que cobre
// tanto "bloqueado pela RLS" como "permission denied for table" depois de
// revogar o GRANT).

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

describe('E2E Segurança — RPC-only writes (jobs, marketplace, reservas)', () => {
  const email = `test-rpc-${Date.now()}@otj.test`;
  const password = 'TestPassword123!';

  let userId: string;
  let user: SupabaseClient;
  let empresaId: number;
  let jobId: number;
  let adId: number;
  let restauranteReservaId: number;
  let alojamentoReservaId: number;

  beforeAll(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    userId = data.user!.id;

    // Adulto verificado, para não bater na minors policy do marketplace.
    const { error: pErr } = await admin
      .from('profiles')
      .upsert({ id: userId, username: `test_rpc_${Date.now()}`, data_nascimento: '1990-01-01' });
    if (pErr) throw new Error(`profiles upsert: ${pErr.message}`);

    // Empresa aprovada, para poder chamar job_criar (setup via admin, ignora RLS).
    const { data: empresa, error: eErr } = await admin
      .from('empregos_empresas')
      .insert({ profile_id: userId, nome_empresa: `Empresa Teste RPC ${Date.now()}`, estado: 'aprovado' })
      .select('id')
      .single();
    if (eErr) throw new Error(`empregos_empresas insert: ${eErr.message}`);
    empresaId = empresa.id;

    user = createClient(URL, ANON, { auth: { persistSession: false } });
    const { error: sErr } = await user.auth.signInWithPassword({ email, password });
    if (sErr) throw new Error(`signIn: ${sErr.message}`);
  });

  afterAll(async () => {
    if (jobId) await admin.from('jobs').delete().eq('id', jobId);
    if (empresaId) await admin.from('empregos_empresas').delete().eq('id', empresaId);
    if (adId) await admin.from('marketplace_ads').delete().eq('id', adId);
    if (restauranteReservaId) await admin.from('restaurante_reservas').delete().eq('id', restauranteReservaId);
    if (alojamentoReservaId) await admin.from('reservas_alojamento').delete().eq('id', alojamentoReservaId);
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  describe('jobs', () => {
    it('job_criar cria a vaga em rascunho', async () => {
      const { data, error } = await user.rpc('job_criar', {
        p_empresa_id: empresaId,
        p_titulo: 'Vaga E2E',
        p_descricao: 'Descrição de teste',
        p_categoria: 'outros',
        p_modalidade: 'presencial',
        p_tipo_contrato: 'efetivo',
        p_nivel_experiencia: 'pleno',
        p_municipio_id: 1,
      });
      expect(error).toBeNull();
      expect(data).toBeTruthy();
      jobId = data;
    });

    it('job_editar altera título, descrição e salário', async () => {
      const { error } = await user.rpc('job_editar', {
        p_job_id: jobId,
        p_titulo: 'Vaga E2E editada',
        p_descricao: 'Descrição editada',
        p_salario_min: 1200,
        p_salario_max: 1800,
      });
      expect(error).toBeNull();

      const { data } = await admin.from('jobs').select('titulo, salario_min').eq('id', jobId).single();
      expect(data?.titulo).toBe('Vaga E2E editada');
      expect(Number(data?.salario_min)).toBe(1200);
    });

    it('ciclo de estados: publicar → pausar → fechar → reabrir → publicar', async () => {
      let r = await user.rpc('job_publicar', { p_job_id: jobId });
      expect(r.error).toBeNull();
      let row = await admin.from('jobs').select('estado').eq('id', jobId).single();
      expect(row.data?.estado).toBe('publicada');

      r = await user.rpc('job_pausar', { p_job_id: jobId });
      expect(r.error).toBeNull();
      row = await admin.from('jobs').select('estado').eq('id', jobId).single();
      expect(row.data?.estado).toBe('pausada');

      r = await user.rpc('job_fechar', { p_job_id: jobId });
      expect(r.error).toBeNull();
      row = await admin.from('jobs').select('estado').eq('id', jobId).single();
      expect(row.data?.estado).toBe('fechada');

      // job_reabrir só actua a partir de 'fechada', e devolve a vaga a
      // 'pausada' (não republica sozinho — decisão deliberada do RPC).
      r = await user.rpc('job_reabrir', { p_job_id: jobId });
      expect(r.error).toBeNull();
      row = await admin.from('jobs').select('estado').eq('id', jobId).single();
      expect(row.data?.estado).toBe('pausada');

      r = await user.rpc('job_publicar', { p_job_id: jobId });
      expect(r.error).toBeNull();
      row = await admin.from('jobs').select('estado').eq('id', jobId).single();
      expect(row.data?.estado).toBe('publicada');
    });

    it('INSERT directo em jobs é bloqueado', async () => {
      const { error } = await user.from('jobs').insert({
        empresa_id: empresaId,
        titulo: 'Direto — não deve passar',
        descricao: 'x',
        estado: 'publicada',
      });
      expect(error).toBeTruthy();
      expect(error?.code).toBe('42501');
    });
  });

  describe('marketplace_ads', () => {
    it('marketplace_ad_criar / _editar / _apagar funcionam de ponta a ponta', async () => {
      const { data: id, error: cErr } = await user.rpc('marketplace_ad_criar', {
        p_title: 'Anúncio E2E',
        p_description: 'Descrição',
        p_type: 'venda',
        p_details: {},
      });
      expect(cErr).toBeNull();
      expect(id).toBeTruthy();
      adId = id;

      const { error: eErr } = await user.rpc('marketplace_ad_editar', {
        p_ad_id: adId,
        p_title: 'Anúncio E2E editado',
        p_description: 'Descrição editada',
      });
      expect(eErr).toBeNull();
      const { data: row } = await admin.from('marketplace_ads').select('title, status').eq('id', adId).single();
      expect(row?.title).toBe('Anúncio E2E editado');

      const { error: dErr } = await user.rpc('marketplace_ad_apagar', { p_ad_id: adId });
      expect(dErr).toBeNull();
      const { data: after } = await admin.from('marketplace_ads').select('status').eq('id', adId).single();
      expect(after?.status).toBe('cancelled');
    });

    it('INSERT directo em marketplace_ads é bloqueado (permission denied, GRANT revogado)', async () => {
      const { error } = await user.from('marketplace_ads').insert({
        author_id: userId,
        title: 'Direto — não deve passar',
        description: 'x',
        type: 'venda',
        status: 'active',
      });
      expect(error).toBeTruthy();
      expect(error?.code).toBe('42501');
    });
  });

  describe('restaurante_reservas', () => {
    it('restaurante_reserva_criar / _editar / _cancelar funcionam de ponta a ponta', async () => {
      const { data: id, error: cErr } = await user.rpc('restaurante_reserva_criar', {
        p_restaurante_id: 1,
        p_nome_cliente: 'Cliente E2E',
        p_email_cliente: 'cliente-e2e@otj.test',
        p_data_reserva: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        p_hora_reserva: '20:00',
        p_numero_pessoas: 2,
      });
      expect(cErr).toBeNull();
      expect(id).toBeTruthy();
      restauranteReservaId = id;

      const novaData = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
      const { error: eErr } = await user.rpc('restaurante_reserva_editar', {
        p_reserva_id: restauranteReservaId,
        p_data_reserva: novaData,
        p_hora_reserva: '21:00',
      });
      expect(eErr).toBeNull();
      const { data: row } = await admin
        .from('restaurante_reservas')
        .select('data_reserva, hora_reserva')
        .eq('id', restauranteReservaId)
        .single();
      expect(row?.data_reserva).toBe(novaData);

      const { error: xErr } = await user.rpc('restaurante_reserva_cancelar', { p_reserva_id: restauranteReservaId });
      expect(xErr).toBeNull();
      const { data: after } = await admin
        .from('restaurante_reservas')
        .select('id')
        .eq('id', restauranteReservaId);
      expect(after?.length ?? 0).toBe(0); // _cancelar apaga a linha (sem coluna de estado nesta tabela)
      restauranteReservaId = 0; // já não existe, não tentar apagar de novo no afterAll
    });

    it('INSERT directo em restaurante_reservas é bloqueado', async () => {
      const { error } = await user.from('restaurante_reservas').insert({
        restaurante_id: 1,
        nome_cliente: 'Direto',
        email_cliente: 'x@otj.test',
        data_reserva: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        hora_reserva: '20:00',
        numero_pessoas: 2,
        user_id: userId,
      });
      expect(error).toBeTruthy();
      expect(error?.code).toBe('42501');
    });
  });

  describe('reservas_alojamento', () => {
    it('criar_reserva_alojamento (RPC usada pela app) funciona de ponta a ponta', async () => {
      const { data: reserva, error: cErr } = await user.rpc('criar_reserva_alojamento', {
        p_alojamento_id: 1,
        p_nome_hospede: 'Hóspede E2E',
        p_email_hospede: 'hospede-e2e@otj.test',
        p_telefone_hospede: '912345678',
        p_data_entrada: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
        p_data_saida: new Date(Date.now() + 22 * 86400000).toISOString().slice(0, 10),
        p_num_pessoas: 2,
        p_num_quartos: 1,
        p_tipo_refeicao: 'sem_refeicoes',
        p_observacoes: null,
      });
      expect(cErr).toBeNull();
      expect(reserva?.id).toBeTruthy();
      alojamentoReservaId = reserva.id;
      expect(reserva.status).toBe('pendente');
    });

    it('UPDATE directo em reservas_alojamento não tem efeito (RLS filtra a linha, não há policy de UPDATE)', async () => {
      // Ao contrário do INSERT (onde o WITH CHECK falhado dá erro 42501),
      // a RLS em UPDATE/DELETE funciona como um WHERE implícito: sem
      // nenhuma policy de UPDATE permissiva, o Postgres não dá erro —
      // simplesmente não encontra nenhuma linha para atualizar. Por isso
      // aqui confirmamos "sem efeito" (estado inalterado), não um erro.
      await user.from('reservas_alojamento').update({ status: 'confirmada' }).eq('id', alojamentoReservaId);
      const { data } = await admin
        .from('reservas_alojamento')
        .select('status')
        .eq('id', alojamentoReservaId)
        .single();
      expect(data?.status).toBe('pendente');
    });
  });
});
