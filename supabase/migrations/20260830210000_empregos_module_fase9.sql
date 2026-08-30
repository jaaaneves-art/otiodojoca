-- ============================================================
-- OTJ - MÓDULO EMPREGOS ("JobNex", nome provisório) - FASE 9 (v1)
-- ============================================================
-- Migration escrita à mão, mesma disciplina das anteriores do módulo.
-- supabase/config.toml tem schema_paths = [], o diff declarativo não
-- está configurado.
--
-- Puramente aditiva: alertas de emprego (pesquisa guardada +
-- notificação quando surge vaga nova compatível), a primeira das três
-- funcionalidades pós-MVP listadas na secção 9+ de docs/EMPREGOS.md.
-- `notifications.type` já incluía 'job_alert' desde a migration da
-- Fase 2 -- foi deixado lá de propósito à espera desta fase, por isso
-- não precisa de alteração agora.
--
-- *** IMPORTANTE — NÃO TESTADA LOCALMENTE ***
-- Mesma nota de sempre: sem device_bash nesta sessão, não foi possível
-- correr `supabase db reset`. O Yos deve copiar para
-- supabase/migrations/, correr `db reset` local, confirmar que aplica
-- sem erros, e só depois `db push` para produção.
--
-- Nota de arquitetura importante: ao contrário de todas as fases
-- anteriores, esta introduz a primeira peça do módulo que corre fora
-- do pedido de um utilizador -- um endpoint (app/api/cron/job-alerts)
-- que tem de ser chamado periodicamente (Vercel Cron ou equivalente)
-- para verificar os alertas e criar notificações. Ver secção 15 de
-- docs/EMPREGOS.md para os passos de configuração fora do código
-- (variável de ambiente CRON_SECRET).
-- ============================================================


-- ------------------------------------------------------------
-- 1) TABELA job_alerts (pesquisas guardadas)
-- ------------------------------------------------------------

create table "public"."job_alerts" (
  "id"                     bigint                   generated always as identity not null,
  "candidate_id"           uuid                     not null,
  "nome"                   text                     not null,
  "termo"                  text,
  "municipio_id"           bigint,
  "modalidade"             text,
  "ativo"                  boolean                  not null default true,
  "ultima_verificacao_em"  timestamp with time zone,
  "created_at"             timestamp with time zone not null default now(),
  constraint "job_alerts_pkey" primary key (id),
  constraint "job_alerts_candidate_id_fkey" foreign key (candidate_id) references public.profiles(id) on delete cascade,
  constraint "job_alerts_municipio_id_fkey" foreign key (municipio_id) references public.municipios(id),
  constraint "job_alerts_modalidade_check"
    check ((modalidade is null) or (modalidade = ANY (ARRAY['presencial'::text, 'remoto'::text, 'hibrido'::text])))
);

create index idx_job_alerts_candidate on public.job_alerts using btree (candidate_id);
create index idx_job_alerts_ativo on public.job_alerts using btree (ativo);


-- ------------------------------------------------------------
-- 2) TABELA job_alert_matches (histórico de vagas já notificadas por
--    alerta -- evita notificar duas vezes a mesma vaga para o mesmo
--    alerta; o constraint de unicidade permite ao endpoint do cron
--    usar "insert ... on conflict do nothing" e assim só notificar
--    quando a linha for mesmo nova)
-- ------------------------------------------------------------

create table "public"."job_alert_matches" (
  "id"          bigint                   generated always as identity not null,
  "alert_id"    bigint                   not null,
  "job_id"      bigint                   not null,
  "created_at"  timestamp with time zone not null default now(),
  constraint "job_alert_matches_pkey" primary key (id),
  constraint "job_alert_matches_alert_id_fkey" foreign key (alert_id) references public.job_alerts(id) on delete cascade,
  constraint "job_alert_matches_job_id_fkey" foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint "job_alert_matches_alert_id_job_id_key" unique (alert_id, job_id)
);

create index idx_job_alert_matches_alert on public.job_alert_matches using btree (alert_id);


-- ------------------------------------------------------------
-- 3) RLS job_alerts -- só o próprio candidato gere os seus alertas
-- ------------------------------------------------------------

alter table "public"."job_alerts" enable row level security;

create policy "Candidato gere os seus alertas" on "public"."job_alerts"
  for all
  to "authenticated"
  using ((auth.uid() = candidate_id))
  with check ((auth.uid() = candidate_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."job_alerts" to "anon", "authenticated", "postgres", "service_role";


-- ------------------------------------------------------------
-- 4) RLS job_alert_matches -- só escrito pelo endpoint do cron (service
--    role, mesmo motivo de "Sistema cria notificacoes" em notifications:
--    nenhum utilizador comum devia poder inserir isto diretamente), o
--    candidato só lê as correspondências dos seus próprios alertas
-- ------------------------------------------------------------

alter table "public"."job_alert_matches" enable row level security;

create policy "Servico cria correspondencias de alertas" on "public"."job_alert_matches"
  for insert
  to "service_role"
  with check (true);

create policy "Candidato ve as correspondencias dos seus alertas" on "public"."job_alert_matches"
  for select
  to "authenticated"
  using ((exists ( select 1
   from public.job_alerts ja
  where ((ja.id = job_alert_matches.alert_id) AND (ja.candidate_id = auth.uid())))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."job_alert_matches" to "anon", "authenticated", "postgres", "service_role";
