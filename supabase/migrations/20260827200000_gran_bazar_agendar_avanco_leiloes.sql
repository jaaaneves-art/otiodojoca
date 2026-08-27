-- ============================================================
-- GRAN BAZAR — LACUNA-02: agendar o fecho automático de leilões
-- ============================================================
-- gran_bazar_advance_auctions() (ver 20260823000000_gran_bazar_leiloes_ativos.sql,
-- secção 5) já existe e faz todo o trabalho (scheduled→live, live→ended,
-- reflete o resultado no anúncio: sold/expired) — mas nada a chamava
-- periodicamente. Sem isto, os leilões (Gran Bazar, e também Viaturas e
-- Imóveis, que reaproveitam este motor via `module`) nunca fechavam
-- sozinhos: só avançavam de estado se alguém licitasse depois da hora de
-- fim (gran_bazar_place_bid() tem uma auto-correção para 'scheduled'→
-- 'live', mas nada equivalente para 'live'→'ended').
--
-- Duas opções foram avaliadas (ver docs/pendentes/RELATORIO-BACKEND-API-
-- BLOCO6-20260823.md, secção 24): Vercel Cron Jobs (rejeitado — o projeto
-- está no plano Hobby, que só permite cron 1x/dia, insuficiente) e pg_cron
-- dentro do próprio Supabase (escolhido — corre no plano Free, só é
-- limitado pelos recursos que consome, e permite granularidade de
-- minutos). Risco documentado e aceite: projetos Free do Supabase pausam
-- ao fim de 1 semana sem atividade, o que também pararia este job até
-- alguém reativar o projeto manualmente no dashboard.
--
-- gran_bazar_advance_auctions() só tem grant de execute para service_role
-- (ver migration original) — sem problema aqui, porque o job do pg_cron
-- corre com o role que o agendou (quem aplica esta migration, tipicamente
-- postgres/supabase_admin, que é superuser e ignora grants).

create extension if not exists pg_cron;

grant usage on schema cron to postgres;

-- Idempotência: se esta migration for reaplicada (ex: reset de ambiente),
-- remove o agendamento anterior antes de recriar, em vez de duplicar o job
-- ou falhar com "job already exists".
do $$
begin
  if exists (select 1 from cron.job where jobname = 'gran-bazar-advance-auctions') then
    perform cron.unschedule('gran-bazar-advance-auctions');
  end if;
end $$;

select cron.schedule(
  'gran-bazar-advance-auctions',
  '*/5 * * * *',
  $$ select public.gran_bazar_advance_auctions(); $$
);
