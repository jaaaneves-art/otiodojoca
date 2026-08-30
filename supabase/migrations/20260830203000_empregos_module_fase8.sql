-- ============================================================
-- OTJ - MÓDULO EMPREGOS ("JobNex", nome provisório) - FASE 8 (v1)
-- ============================================================
-- Migration escrita à mão, mesma disciplina das anteriores do módulo
-- (20260830132000_empregos_module_fase2.sql): supabase/config.toml tem
-- schema_paths = [], o diff declarativo não está configurado.
--
-- Puramente aditiva: cria a tabela de denúncias de vagas e dá aos
-- administradores (profiles.role = 'admin') acesso de gestão a `jobs`,
-- que até agora só tinha políticas para a própria empresa (RLS
-- "Empresa gere as suas vagas") e para o público (vagas publicadas).
-- Sem essa política nova, um admin nem conseguiria ver um rascunho
-- denunciado, nem rejeitar uma vaga publicada de outra empresa.
--
-- *** IMPORTANTE — NÃO TESTADA LOCALMENTE ***
-- Mesma nota das migrations anteriores do módulo: esta sessão não tem
-- device_bash, por isso não foi possível correr `supabase db reset`
-- nem verificar isto automaticamente antes de chegar aqui. O Yos deve:
--   1. Copiar este ficheiro para supabase/migrations/
--   2. Correr `supabase db reset` localmente e confirmar que aplica
--      sem erros e que a app continua a funcionar
--   3. Só depois `supabase db push` para produção
-- NÃO aplicar diretamente em produção sem o passo 2.
--
-- Decisão de design registada aqui para ficar rastreável: em vez de um
-- estado novo ("suspensa"), a rejeição por admin reutiliza o estado
-- 'rejeitada' que já existia no CHECK de jobs.estado desde a Fase 2 mas
-- nunca era atingível por nenhum código (só a empresa podia mudar o
-- estado, e as suas ações -- publicar/pausar/fechar/reabrir -- nunca
-- escolhem 'rejeitada'). Reativar uma vaga rejeitada devolve-a a
-- 'pausada', não a 'publicada' -- a empresa tem de republicar
-- explicitamente, o admin não repõe uma vaga visível ao público sem
-- confirmação ativa de quem a criou.
-- ============================================================


-- ------------------------------------------------------------
-- 1) TABELA job_reports (denúncias de vagas)
-- ------------------------------------------------------------

create table "public"."job_reports" (
  "id"            bigint                   generated always as identity not null,
  "job_id"        bigint                   not null,
  "reporter_id"   uuid                     not null,
  "motivo"        text                     not null,
  "mensagem"      text,
  "estado"        text                     not null default 'pendente'::text,
  "resolvido_por" uuid,
  "resolvido_em"  timestamp with time zone,
  "nota_admin"    text,
  "created_at"    timestamp with time zone not null default now(),
  constraint "job_reports_pkey" primary key (id),
  constraint "job_reports_job_id_fkey" foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint "job_reports_reporter_id_fkey" foreign key (reporter_id) references public.profiles(id) on delete cascade,
  constraint "job_reports_resolvido_por_fkey" foreign key (resolvido_por) references public.profiles(id),
  constraint "job_reports_motivo_check"
    check ((motivo = ANY (ARRAY['spam'::text, 'fraude'::text, 'discriminatorio'::text, 'conteudo_inadequado'::text, 'outro'::text]))),
  constraint "job_reports_estado_check"
    check ((estado = ANY (ARRAY['pendente'::text, 'resolvida'::text, 'ignorada'::text])))
);

create index idx_job_reports_job on public.job_reports using btree (job_id);
create index idx_job_reports_estado on public.job_reports using btree (estado, created_at);
create index idx_job_reports_reporter on public.job_reports using btree (reporter_id);


-- ------------------------------------------------------------
-- 2) RLS job_reports
-- ------------------------------------------------------------

alter table "public"."job_reports" enable row level security;

create policy "Utilizador cria denuncias" on "public"."job_reports"
  for insert
  to "authenticated"
  with check ((auth.uid() = reporter_id));

create policy "Utilizador ve as suas denuncias" on "public"."job_reports"
  for select
  to "authenticated"
  using ((auth.uid() = reporter_id));

-- Mesmo padrão de "Administradores gerem todos os pedidos" em
-- entidade_pedidos (migration 20260827100000_entidade_pedidos_rls_usar_role.sql):
-- profiles.role, não profiles.is_admin.
create policy "Administradores gerem todas as denuncias" on "public"."job_reports"
  for all
  to "authenticated"
  using ((exists ( select 1
   from public.profiles p
  where ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))))
  with check ((exists ( select 1
   from public.profiles p
  where ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."job_reports" to "anon", "authenticated", "postgres", "service_role";


-- ------------------------------------------------------------
-- 3) RLS jobs -- acrescentar acesso de administrador (não existia
--    nenhuma política de admin nesta tabela desde a Fase 2)
-- ------------------------------------------------------------

create policy "Administradores gerem todas as vagas" on "public"."jobs"
  for all
  to "authenticated"
  using ((exists ( select 1
   from public.profiles p
  where ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))))
  with check ((exists ( select 1
   from public.profiles p
  where ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))));
