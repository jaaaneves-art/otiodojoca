-- ============================================================================
-- Correção P0/P1 — autoria falsificável, reservas de restaurante públicas
-- e RPC de leilões executável por anon.
--
-- RASCUNHO PARA REVISÃO — não aplicado. Testar primeiro numa base local ou
-- de staging (supabase db reset / supabase start), correr
-- supabase/tests/database/ e os testes novos em
-- 20260911150001_testes_correcao_p0_p1.sql antes de aplicar a produção.
--
-- Âmbito desta migration:
--   1. marketplace_ads / posts / threads: INSERT passa a exigir
--      author_id = auth.uid() (fecha impersonação de autoria).
--   2. restaurante_reservas: remove o INSERT público (anon) e a leitura
--      pública acidental introduzida por "auth.uid() is null" na policy de
--      SELECT (qualquer visitante sem sessão conseguia ler TODAS as
--      reservas — nomes, emails, telefones).
--   3. gran_bazar_advance_auctions(): deixa de ser executável por anon/
--      authenticated (só service_role/scheduler) e passa a search_path=''
--      (o corpo da função já usa nomes totalmente qualificados
--      "public.xxx", por isso não precisa de mais nenhuma alteração).
--   4. Remove o cron job duplicado de leilões (fica só um, a cada 5 min).
--
-- Cada bloco inclui o "rollback" em comentário, para reverter secção a
-- secção se for preciso.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Autoria real nas policies de INSERT (marketplace_ads, posts, threads)
-- ----------------------------------------------------------------------------

drop policy if exists "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads";
create policy "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads"
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Utilizadores autenticados criam posts" on "public"."posts";
create policy "Utilizadores autenticados criam posts" on "public"."posts"
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Utilizadores autenticados criam topicos" on "public"."threads";
create policy "Utilizadores autenticados criam topicos" on "public"."threads"
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Rollback:
-- drop policy "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads";
-- create policy "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads"
--   for insert to PUBLIC with check ((auth.role() = 'authenticated'::text));
-- (idem para posts e threads, restaurando "to PUBLIC ... auth.role() = 'authenticated'")


-- ----------------------------------------------------------------------------
-- 2. restaurante_reservas: fechar INSERT anónimo e a fuga de leitura
-- ----------------------------------------------------------------------------

-- 2a. Remove a policy que permitia a qualquer anon/authenticated inserir
--     com WITH CHECK (true), contornando o login exigido em
--     lib/comer/actions.ts::criarReserva().
drop policy if exists "Permitir criacao publica de reservas" on "public"."restaurante_reservas";

-- 2b. Corrige "Criar reserva com user_id": deixa de aceitar user_id IS NULL
--     (reserva "anónima" sem dono), já que a app sempre exige login antes
--     de chamar criarReserva(). Se for necesário reservas de convidado no
--     futuro, isso deve ser um fluxo explícito com token próprio, não uma
--     policy aberta.
drop policy if exists "Criar reserva com user_id" on "public"."restaurante_reservas";
create policy "Criar reserva com user_id" on "public"."restaurante_reservas"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 2c. Corrige a fuga de leitura: "auth.uid() is null" tornava a condição
--     verdadeira para QUALQUER linha quando o pedido não tinha sessão
--     (porque auth.uid() é sempre null nesse caso, independentemente da
--     linha) -- na prática, leitura pública de todas as reservas do
--     restaurante com a chave anon. Fica só "as próprias".
drop policy if exists "Utilizador vê suas reservas" on "public"."restaurante_reservas";
create policy "Utilizador vê suas reservas" on "public"."restaurante_reservas"
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Rollback:
-- create policy "Permitir criacao publica de reservas" on "public"."restaurante_reservas"
--   for insert to "anon","authenticated" with check (true);
-- drop policy "Criar reserva com user_id" on "public"."restaurante_reservas";
-- create policy "Criar reserva com user_id" on "public"."restaurante_reservas"
--   for insert to PUBLIC with check (((auth.uid() = user_id) OR (user_id IS NULL)));
-- drop policy "Utilizador vê suas reservas" on "public"."restaurante_reservas";
-- create policy "Utilizador vê suas reservas" on "public"."restaurante_reservas"
--   for select to PUBLIC using (((auth.uid() = user_id) or (auth.uid() is null)));


-- ----------------------------------------------------------------------------
-- 3. gran_bazar_advance_auctions(): fechar a anon/authenticated, search_path=''
-- ----------------------------------------------------------------------------

alter function public.gran_bazar_advance_auctions() set search_path to '';

revoke execute on function public.gran_bazar_advance_auctions() from anon, authenticated;
-- postgres e service_role mantêm-se (scheduler/migrations); confirmar se o
-- pg_cron corre como "postgres" (é o caso nesta migration original) antes
-- de revogar esse também.

-- Rollback:
-- alter function public.gran_bazar_advance_auctions() set search_path to 'public';
-- grant execute on function public.gran_bazar_advance_auctions()
--   to anon, authenticated, postgres, service_role;


-- ----------------------------------------------------------------------------
-- 4. Remover o cron job duplicado (fica só o de 5 em 5 minutos)
-- ----------------------------------------------------------------------------

select cron.unschedule('gran-bazar-leiloes-avancar');
-- mantém-se 'gran-bazar-advance-auctions' (*/5 * * * *)

-- Rollback:
-- select cron.schedule_in_database('gran-bazar-leiloes-avancar', '* * * * *',
--   'select public.gran_bazar_advance_auctions();', 'postgres', null, true);
