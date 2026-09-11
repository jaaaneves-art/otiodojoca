-- Testes pgTAP para a migration 20260911150000_correcao_p0_p1_autoria_e_leiloes.sql
--
-- RASCUNHO — correr numa base local depois de aplicar a migration acima
-- (supabase db reset local + aplicar; depois `supabase test db`, seguindo
-- o mesmo padrão de npm run test:social-rls:db usado para
-- supabase/tests/database/social_rls.test.sql).
--
-- Colunas confirmadas por inspeção de
-- supabase/migrations/20260829220537_remote_schema.sql — ajustar aqui se
-- o schema tiver mudado entretanto.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

-- 5 secções x 2 asserções cada (throws_ok/lives_ok/results_eq/ok) = 10.
-- (Ficou planeado 11 por engano numa versão anterior deste ficheiro --
-- só se notou porque antes o script abortava mais cedo, no bug do
-- hasnt_function_privilege() corrigido abaixo, e nunca chegava a expor
-- esta contagem errada.)
select plan(10);

-- Fixtures
insert into auth.users (id, email)
values
  ('50000000-0000-0000-0000-000000000001', 'p0-a@example.test'),
  ('50000000-0000-0000-0000-000000000002', 'p0-b@example.test');

insert into public.profiles (id, username, display_name, role)
values
  ('50000000-0000-0000-0000-000000000001', 'p0-user-a', 'Utilizador A', 'user'),
  ('50000000-0000-0000-0000-000000000002', 'p0-user-b', 'Utilizador B', 'user')
on conflict (id) do nothing;

insert into public.categories (name, slug, type)
values ('Categoria Teste P0', 'categoria-teste-p0', 'forum')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 1. marketplace_ads: A não consegue inserir um anúncio com author_id de B
-- ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.marketplace_ads (author_id, title)
    values ('50000000-0000-0000-0000-000000000002', 'Anuncio falsificado')$$,
  'new row violates row-level security policy for table "marketplace_ads"',
  'A não consegue criar anúncio em nome de B'
);

select lives_ok(
  $$insert into public.marketplace_ads (author_id, title)
    values ('50000000-0000-0000-0000-000000000001', 'Anuncio legitimo de A')$$,
  'A consegue criar o seu próprio anúncio'
);

-- ----------------------------------------------------------------------------
-- 2. threads: mesmo padrão (necessário slug + category_id válidos)
-- ----------------------------------------------------------------------------
select throws_ok(
  format(
    $$insert into public.threads (author_id, title, slug, category_id)
      values ('50000000-0000-0000-0000-000000000002', 'topico falsificado',
              'topico-falsificado', %s)$$,
    (select id from public.categories where slug = 'categoria-teste-p0')
  ),
  'new row violates row-level security policy for table "threads"',
  'A não consegue criar tópico em nome de B'
);

select lives_ok(
  format(
    $$insert into public.threads (author_id, title, slug, category_id)
      values ('50000000-0000-0000-0000-000000000001', 'topico legitimo de A',
              'topico-legitimo-de-a', %s)$$,
    (select id from public.categories where slug = 'categoria-teste-p0')
  ),
  'A consegue criar o seu próprio tópico'
);

-- ----------------------------------------------------------------------------
-- 3. posts: mesmo padrão (necessário thread_id válido)
-- ----------------------------------------------------------------------------
select throws_ok(
  format(
    $$insert into public.posts (author_id, thread_id, content)
      values ('50000000-0000-0000-0000-000000000002', %s, 'post falsificado')$$,
    (select id from public.threads where slug = 'topico-legitimo-de-a')
  ),
  'new row violates row-level security policy for table "posts"',
  'A não consegue publicar post em nome de B'
);

select lives_ok(
  format(
    $$insert into public.posts (author_id, thread_id, content)
      values ('50000000-0000-0000-0000-000000000001', %s, 'post legitimo de A')$$,
    (select id from public.threads where slug = 'topico-legitimo-de-a')
  ),
  'A consegue publicar o seu próprio post'
);

-- ----------------------------------------------------------------------------
-- 4. restaurante_reservas: anon não pode inserir nem ler
-- ----------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$insert into public.restaurante_reservas
      (user_id, nome_cliente, data_reserva, numero_pessoas)
    values (null, 'Convidado anonimo', current_date + 1, 2)$$,
  'new row violates row-level security policy for table "restaurante_reservas"',
  'anon não consegue inserir reserva diretamente via PostgREST'
);

-- este é o teste que teria falhado ANTES da correção: confirma que anon
-- já não vê nenhuma linha (antes via "auth.uid() is null" via-se tudo)
select results_eq(
  $$select count(*)::bigint from public.restaurante_reservas$$,
  $$values (0::bigint)$$,
  'anon não lê nenhuma reserva de restaurante'
);

-- ----------------------------------------------------------------------------
-- 5. gran_bazar_advance_auctions(): anon/authenticated deixam de poder executar
-- ----------------------------------------------------------------------------
-- hasnt_function_privilege() do pgTAP não existe nesta versão local da
-- extensão (mesma falha, pré-existente, em pets_rls.test.sql e
-- social_rls.test.sql com hasnt_table_privilege) -- usa-se diretamente
-- has_function_privilege() do próprio Postgres (não é do pgTAP, existe em
-- qualquer versão suportada) dentro de ok().
select ok(
  not has_function_privilege('anon', 'public.gran_bazar_advance_auctions()', 'EXECUTE'),
  'anon não pode executar gran_bazar_advance_auctions()'
);
select ok(
  not has_function_privilege('authenticated', 'public.gran_bazar_advance_auctions()', 'EXECUTE'),
  'authenticated não pode executar gran_bazar_advance_auctions()'
);

select * from finish();
rollback;
