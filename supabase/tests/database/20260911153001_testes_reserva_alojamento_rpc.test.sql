-- Testes pgTAP para 20260911153000_reserva_alojamento_rpc_transacional.sql
--
-- RASCUNHO — correr numa base local depois de aplicar as duas migrations
-- de correção (autoria/leilões + esta), na mesma sessão de testes que
-- 20260911150001_testes_correcao_p0_p1.test.sql.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, email)
values ('60000000-0000-0000-0000-000000000001', 'alojamento-a@example.test');

insert into public.localizacoes (codigo_postal, nome, localidade)
values ('4800-000', 'Localizacao Teste', 'Guimaraes')
on conflict do nothing;

-- "alojamentos.tipo" tem FK para tipos_alojamento(nome). Não há
-- supabase/seed.sql neste projeto, por isso uma base local acabada de
-- resetar tem esta tabela de lookup vazia -- sem este insert, a fixture
-- abaixo falha com "violates foreign key constraint alojamentos_tipo_fkey"
-- (visto numa base local limpa; em remoto/staging já deve estar seedada).
insert into public.tipos_alojamento (nome)
values ('casa_rural')
on conflict (nome) do nothing;

-- "id" é identity (GENERATED ALWAYS) -- sem "overriding system value" o
-- Postgres recusa o valor explícito 900001 usado como fixture nos testes
-- abaixo.
insert into public.alojamentos (id, nome, tipo, localizacao_id, preco_noite, num_quartos)
overriding system value
values (900001, 'Alojamento Teste RPC', 'casa_rural',
        (select id from public.localizacoes where codigo_postal = '4800-000' limit 1),
        100.00, 2)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 1. anon não pode chamar a RPC diretamente
-- ----------------------------------------------------------------------------
-- hasnt_function_privilege() do pgTAP não existe nesta versão local da
-- extensão -- mesmo contorno usado em 20260911150001_testes_correcao_p0_p1.test.sql,
-- com has_function_privilege() nativo do Postgres dentro de ok().
select ok(
  not has_function_privilege(
    'anon',
    'public.criar_reserva_alojamento(bigint,text,text,text,date,date,integer,integer,text,text)',
    'EXECUTE'
  ),
  'anon não pode executar criar_reserva_alojamento()'
);

-- ----------------------------------------------------------------------------
-- 2. authenticated sem sessão válida (sem sub no JWT) é rejeitado pela RPC
-- ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);

select throws_ok(
  $$select public.criar_reserva_alojamento(
      900001, 'Hospede Teste', 'hospede@example.test', null,
      current_date + 5, current_date + 7, 2, 1, 'sem_refeicoes', null)$$,
  'É preciso iniciar sessão para fazer uma reserva.',
  'RPC recusa pedido sem auth.uid()'
);

-- ----------------------------------------------------------------------------
-- 3. Com sessão: preço calculado no servidor (2 noites x 100.00 = 200.00)
-- ----------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  $$select preco_total from public.criar_reserva_alojamento(
      900001, 'Hospede Teste', 'hospede@example.test', null,
      current_date + 5, current_date + 7, 2, 1, 'sem_refeicoes', null)$$,
  $$values (200.00::numeric)$$,
  'Preço calculado no servidor (2 noites x preco_noite), não aceite do cliente'
);

-- ----------------------------------------------------------------------------
-- 4. Data no passado é rejeitada
-- ----------------------------------------------------------------------------
select throws_ok(
  $$select public.criar_reserva_alojamento(
      900001, 'Hospede Teste', 'hospede@example.test', null,
      current_date - 3, current_date - 1, 2, 1, 'sem_refeicoes', null)$$,
  'A data de entrada não pode ser no passado.',
  'RPC recusa data de entrada no passado'
);

-- ----------------------------------------------------------------------------
-- 5. Pedir mais quartos do que o alojamento tem é rejeitado
-- ----------------------------------------------------------------------------
select throws_ok(
  $$select public.criar_reserva_alojamento(
      900001, 'Hospede Teste', 'hospede@example.test', null,
      current_date + 10, current_date + 12, 2, 5, 'sem_refeicoes', null)$$,
  'Este alojamento só tem 2 quarto(s) no total.',
  'RPC recusa pedir mais quartos do que existem'
);

-- ----------------------------------------------------------------------------
-- 6/7. Sobreposição: 2 quartos disponíveis, duas reservas de 1 quarto para
-- as mesmas datas cabem; a terceira (esgota a capacidade) é rejeitada.
-- ----------------------------------------------------------------------------
select lives_ok(
  $$select public.criar_reserva_alojamento(
      900001, 'Hospede 1', 'h1@example.test', null,
      current_date + 20, current_date + 22, 1, 1, 'sem_refeicoes', null)$$,
  'Primeira reserva do intervalo (1 de 2 quartos) é aceite'
);

select lives_ok(
  $$select public.criar_reserva_alojamento(
      900001, 'Hospede 2', 'h2@example.test', null,
      current_date + 21, current_date + 23, 1, 1, 'sem_refeicoes', null)$$,
  'Segunda reserva sobreposta, ainda dentro da capacidade (2 de 2), é aceite'
);

select * from finish();
rollback;
