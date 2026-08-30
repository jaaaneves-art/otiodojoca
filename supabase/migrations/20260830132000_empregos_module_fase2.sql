-- ============================================================
-- OTJ - MÓDULO EMPREGOS ("JobNex", nome provisório) - FASE 2 (v1)
-- ============================================================
-- Migration escrita à mão (não gerada por `supabase db diff`, pelo
-- mesmo motivo já registado em 20260829223000_social_module_v1.sql:
-- supabase/config.toml tem `schema_paths = []`, o diff declarativo
-- não está configurado, por isso não é seguro usá-lo agora).
--
-- Puramente aditiva: cria as tabelas do módulo Empregos (secção 4
-- de docs/EMPREGOS.md), alarga dois CHECKs existentes
-- (entidade_pedidos.tipo_entidade, notifications.type) e insere um
-- catálogo inicial de competências. Nada é apagado ou alterado
-- destrutivamente.
--
-- *** IMPORTANTE — NÃO TESTADA LOCALMENTE ***
-- Esta sessão não tem terminal ligado ao computador do Yos (sem
-- device_bash), por isso esta migration não pôde ser corrida com
-- `supabase db reset` nem verificada de nenhuma outra forma
-- automática antes de chegar aqui. Segue a disciplina do projeto
-- (tabelas simples primeiro, RLS depois, mesma sintaxe dos CHECKs
-- e políticas já existentes) mas o Yos deve:
--   1. Copiar este ficheiro para supabase/migrations/
--   2. Correr `supabase db reset` localmente e confirmar que aplica
--      sem erros e que a app continua a funcionar
--   3. Só depois `supabase db push` para produção
-- NÃO aplicar diretamente em produção sem o passo 2.
--
-- Duas simplificações face ao desenhado em docs/EMPREGOS.md secção 3,
-- registadas aqui para ficarem rastreáveis:
--   a) `empregos_empresas` liga-se a `entidades` por FK direta
--      (entidade_id bigint) em vez do mecanismo genérico
--      ref_tabela/ref_id — esse mecanismo usa ref_id uuid e nenhuma
--      tabela do projeto o usa ainda de facto, então uma FK direta é
--      mais simples e igualmente reversível.
--   b) Foi acrescentada `candidate_skills` (não estava explícita no
--      documento) porque o motor de matching por regras (secção 5)
--      precisa de competências do candidato ligadas ao mesmo
--      catálogo `skills` usado em `job_skills`, não texto livre.
-- ============================================================


-- ------------------------------------------------------------
-- 1) TABELAS
-- ------------------------------------------------------------

-- Catálogo curado de competências, partilhado entre candidatos e vagas
create table "public"."skills" (
  "id"         bigint                   generated always as identity not null,
  "nome"       text                     not null,
  "slug"       text                     not null,
  "created_at" timestamp with time zone not null default now(),
  constraint "skills_pkey" primary key (id),
  constraint "skills_nome_key" unique (nome),
  constraint "skills_slug_key" unique (slug)
);

-- Perfil de candidato, 1:1 com profiles
create table "public"."candidate_profiles" (
  "id"                              uuid                     not null,
  "profissao"                       text,
  "resumo"                          text,
  "nivel_experiencia"               text,
  "nivel_formacao"                  text,
  "disponibilidade"                 text                     not null default 'a_combinar'::text,
  "pretensao_salarial_min"          numeric(10,2),
  "pretensao_salarial_max"          numeric(10,2),
  "disponivel_mudanca_residencia"   boolean                  not null default false,
  "disponivel_viajar"               boolean                  not null default false,
  "municipio_id"                    bigint,
  "perfil_publico"                  boolean                  not null default false,
  "created_at"                      timestamp with time zone not null default now(),
  "updated_at"                      timestamp with time zone not null default now(),
  constraint "candidate_profiles_pkey" primary key (id),
  constraint "candidate_profiles_id_fkey" foreign key (id) references public.profiles(id) on delete cascade,
  constraint "candidate_profiles_municipio_id_fkey" foreign key (municipio_id) references public.municipios(id),
  constraint "candidate_profiles_nivel_experiencia_check"
    check ((nivel_experiencia is null) or (nivel_experiencia = ANY (ARRAY['sem_experiencia'::text, 'junior'::text, 'pleno'::text, 'senior'::text, 'especialista'::text]))),
  constraint "candidate_profiles_nivel_formacao_check"
    check ((nivel_formacao is null) or (nivel_formacao = ANY (ARRAY['ensino_basico'::text, 'ensino_secundario'::text, 'licenciatura'::text, 'mestrado'::text, 'doutoramento'::text, 'outro'::text]))),
  constraint "candidate_profiles_disponibilidade_check"
    check ((disponibilidade = ANY (ARRAY['imediata'::text, 'aviso_previo'::text, 'a_combinar'::text])))
);

-- Competências do candidato (many-to-many com skills)
create table "public"."candidate_skills" (
  "id"           bigint                   generated always as identity not null,
  "candidate_id" uuid                     not null,
  "skill_id"     bigint                   not null,
  "nivel"        text                     not null default 'intermedio'::text,
  "created_at"   timestamp with time zone not null default now(),
  constraint "candidate_skills_pkey" primary key (id),
  constraint "candidate_skills_candidate_id_fkey" foreign key (candidate_id) references public.candidate_profiles(id) on delete cascade,
  constraint "candidate_skills_skill_id_fkey" foreign key (skill_id) references public.skills(id) on delete cascade,
  constraint "candidate_skills_candidate_id_skill_id_key" unique (candidate_id, skill_id),
  constraint "candidate_skills_nivel_check" check ((nivel = ANY (ARRAY['basico'::text, 'intermedio'::text, 'avancado'::text])))
);

-- Perfil de empresa. Chega aqui depois de um entidade_pedidos
-- (tipo_entidade = 'empregador') aprovado por um admin.
create table "public"."empregos_empresas" (
  "id"           bigint                   generated always as identity not null,
  "profile_id"   uuid                     not null,
  "entidade_id"  bigint,
  "nome_empresa" text                     not null,
  "nipc"         text,
  "descricao"    text,
  "website"      text,
  "logotipo_url" text,
  "municipio_id" bigint,
  "freguesia_id" bigint,
  "estado"       text                     not null default 'pendente'::text,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  constraint "empregos_empresas_pkey" primary key (id),
  constraint "empregos_empresas_profile_id_fkey" foreign key (profile_id) references public.profiles(id) on delete cascade,
  constraint "empregos_empresas_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete set null,
  constraint "empregos_empresas_municipio_id_fkey" foreign key (municipio_id) references public.municipios(id),
  constraint "empregos_empresas_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id),
  constraint "empregos_empresas_estado_check"
    check ((estado = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'suspenso'::text])))
);

-- Vagas
create table "public"."jobs" (
  "id"                     bigint                   generated always as identity not null,
  "empresa_id"             bigint                   not null,
  "titulo"                 text                     not null,
  "descricao"              text                     not null,
  "categoria"              text,
  "modalidade"             text                     not null default 'presencial'::text,
  "tipo_contrato"          text,
  "nivel_experiencia"      text,
  "nivel_formacao_minimo"  text,
  "salario_min"            numeric(10,2),
  "salario_max"            numeric(10,2),
  "salario_fonte"          text                     not null default 'estimativa'::text,
  "municipio_id"           bigint,
  "freguesia_id"           bigint,
  "estado"                 text                     not null default 'rascunho'::text,
  "data_publicacao"        timestamp with time zone,
  "data_fecho"             timestamp with time zone,
  "created_at"             timestamp with time zone not null default now(),
  "updated_at"             timestamp with time zone not null default now(),
  constraint "jobs_pkey" primary key (id),
  constraint "jobs_empresa_id_fkey" foreign key (empresa_id) references public.empregos_empresas(id) on delete cascade,
  constraint "jobs_municipio_id_fkey" foreign key (municipio_id) references public.municipios(id),
  constraint "jobs_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id),
  constraint "jobs_modalidade_check"
    check ((modalidade = ANY (ARRAY['presencial'::text, 'remoto'::text, 'hibrido'::text]))),
  constraint "jobs_tipo_contrato_check"
    check ((tipo_contrato is null) or (tipo_contrato = ANY (ARRAY['efetivo'::text, 'termo_certo'::text, 'termo_incerto'::text, 'prestacao_servicos'::text, 'estagio'::text, 'part_time'::text, 'freelance'::text]))),
  constraint "jobs_nivel_experiencia_check"
    check ((nivel_experiencia is null) or (nivel_experiencia = ANY (ARRAY['sem_experiencia'::text, 'junior'::text, 'pleno'::text, 'senior'::text, 'especialista'::text]))),
  constraint "jobs_nivel_formacao_minimo_check"
    check ((nivel_formacao_minimo is null) or (nivel_formacao_minimo = ANY (ARRAY['sem_requisito'::text, 'ensino_basico'::text, 'ensino_secundario'::text, 'licenciatura'::text, 'mestrado'::text, 'doutoramento'::text]))),
  constraint "jobs_salario_fonte_check"
    check ((salario_fonte = ANY (ARRAY['empresa'::text, 'estimativa'::text]))),
  constraint "jobs_estado_check"
    check ((estado = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'publicada'::text, 'pausada'::text, 'fechada'::text, 'rejeitada'::text])))
);

-- Competências pedidas por vaga (many-to-many com skills)
create table "public"."job_skills" (
  "id"          bigint                   generated always as identity not null,
  "job_id"      bigint                   not null,
  "skill_id"    bigint                   not null,
  "obrigatoria" boolean                  not null default true,
  constraint "job_skills_pkey" primary key (id),
  constraint "job_skills_job_id_fkey" foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint "job_skills_skill_id_fkey" foreign key (skill_id) references public.skills(id) on delete cascade,
  constraint "job_skills_job_id_skill_id_key" unique (job_id, skill_id)
);

-- Candidaturas
create table "public"."applications" (
  "id"           bigint                   generated always as identity not null,
  "job_id"       bigint                   not null,
  "candidate_id" uuid                     not null,
  "mensagem"     text,
  "cv_url"       text,
  "estado"       text                     not null default 'submetida'::text,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  constraint "applications_pkey" primary key (id),
  constraint "applications_job_id_fkey" foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint "applications_candidate_id_fkey" foreign key (candidate_id) references public.profiles(id) on delete cascade,
  constraint "applications_job_id_candidate_id_key" unique (job_id, candidate_id),
  constraint "applications_estado_check"
    check ((estado = ANY (ARRAY['submetida'::text, 'em_analise'::text, 'entrevista'::text, 'selecionada'::text, 'rejeitada'::text, 'retirada'::text])))
);

-- Histórico de estado da candidatura (auditável, sem update/delete)
create table "public"."application_events" (
  "id"             bigint                   generated always as identity not null,
  "application_id" bigint                   not null,
  "estado"         text                     not null,
  "nota"           text,
  "autor_id"       uuid,
  "created_at"     timestamp with time zone not null default now(),
  constraint "application_events_pkey" primary key (id),
  constraint "application_events_application_id_fkey" foreign key (application_id) references public.applications(id) on delete cascade,
  constraint "application_events_autor_id_fkey" foreign key (autor_id) references public.profiles(id),
  constraint "application_events_estado_check"
    check ((estado = ANY (ARRAY['submetida'::text, 'em_analise'::text, 'entrevista'::text, 'selecionada'::text, 'rejeitada'::text, 'retirada'::text])))
);

-- Vagas guardadas (mesmo padrão de marketplace_favorites)
create table "public"."saved_jobs" (
  "id"           bigint                   generated always as identity not null,
  "candidate_id" uuid                     not null,
  "job_id"       bigint                   not null,
  "created_at"   timestamp with time zone not null default now(),
  constraint "saved_jobs_pkey" primary key (id),
  constraint "saved_jobs_candidate_id_fkey" foreign key (candidate_id) references public.profiles(id) on delete cascade,
  constraint "saved_jobs_job_id_fkey" foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint "saved_jobs_candidate_id_job_id_key" unique (candidate_id, job_id)
);


-- ------------------------------------------------------------
-- 2) ÍNDICES
-- ------------------------------------------------------------

create index idx_candidate_skills_candidate on public.candidate_skills using btree (candidate_id);
create index idx_candidate_skills_skill on public.candidate_skills using btree (skill_id);

create index idx_empregos_empresas_profile on public.empregos_empresas using btree (profile_id);
create index idx_empregos_empresas_estado on public.empregos_empresas using btree (estado);

create index idx_jobs_empresa on public.jobs using btree (empresa_id);
create index idx_jobs_estado on public.jobs using btree (estado, data_publicacao desc);
create index idx_jobs_municipio on public.jobs using btree (municipio_id);

create index idx_job_skills_job on public.job_skills using btree (job_id);
create index idx_job_skills_skill on public.job_skills using btree (skill_id);

create index idx_applications_job on public.applications using btree (job_id);
create index idx_applications_candidate on public.applications using btree (candidate_id);

create index idx_application_events_application on public.application_events using btree (application_id, created_at);

create index idx_saved_jobs_candidate on public.saved_jobs using btree (candidate_id);


-- ------------------------------------------------------------
-- 3) TRIGGERS updated_at (reutiliza public.handle_updated_at(),
--    já usada em profiles e marketplace_ads)
-- ------------------------------------------------------------

create trigger candidate_profiles_updated_at
  before update on public.candidate_profiles
  for each row
  execute function public.handle_updated_at();

create trigger empregos_empresas_updated_at
  before update on public.empregos_empresas
  for each row
  execute function public.handle_updated_at();

create trigger jobs_updated_at
  before update on public.jobs
  for each row
  execute function public.handle_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row
  execute function public.handle_updated_at();


-- ------------------------------------------------------------
-- 4) RLS
-- ------------------------------------------------------------

alter table "public"."skills" enable row level security;
alter table "public"."candidate_profiles" enable row level security;
alter table "public"."candidate_skills" enable row level security;
alter table "public"."empregos_empresas" enable row level security;
alter table "public"."jobs" enable row level security;
alter table "public"."job_skills" enable row level security;
alter table "public"."applications" enable row level security;
alter table "public"."application_events" enable row level security;
alter table "public"."saved_jobs" enable row level security;

-- skills: catálogo curado, leitura pública, escrita só admin/service_role
create policy "Skills visiveis a todos" on "public"."skills"
  for select
  to PUBLIC
  using (true);

-- candidate_profiles
create policy "Candidato gere o seu perfil" on "public"."candidate_profiles"
  for all
  to PUBLIC
  using ((auth.uid() = id))
  with check ((auth.uid() = id));

create policy "Perfil de candidato publico visivel" on "public"."candidate_profiles"
  for select
  to PUBLIC
  using ((perfil_publico = true));

-- candidate_skills
create policy "Candidato gere as suas competencias" on "public"."candidate_skills"
  for all
  to PUBLIC
  using ((auth.uid() = candidate_id))
  with check ((auth.uid() = candidate_id));

create policy "Competencias visiveis quando perfil publico" on "public"."candidate_skills"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.candidate_profiles cp
  where ((cp.id = candidate_skills.candidate_id) AND (cp.perfil_publico = true)))));

-- empregos_empresas
create policy "Empresa gere o seu perfil" on "public"."empregos_empresas"
  for all
  to PUBLIC
  using ((auth.uid() = profile_id))
  with check ((auth.uid() = profile_id));

create policy "Empresas aprovadas visiveis a todos" on "public"."empregos_empresas"
  for select
  to PUBLIC
  using ((estado = 'aprovado'::text));

-- jobs
create policy "Empresa gere as suas vagas" on "public"."jobs"
  for all
  to PUBLIC
  using ((exists ( select 1
   from public.empregos_empresas ee
  where ((ee.id = jobs.empresa_id) AND (ee.profile_id = auth.uid())))))
  with check ((exists ( select 1
   from public.empregos_empresas ee
  where ((ee.id = jobs.empresa_id) AND (ee.profile_id = auth.uid())))));

create policy "Vagas publicadas visiveis a todos" on "public"."jobs"
  for select
  to PUBLIC
  using ((estado = 'publicada'::text));

-- job_skills
create policy "Empresa gere competencias das suas vagas" on "public"."job_skills"
  for all
  to PUBLIC
  using ((exists ( select 1
   from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
  where ((j.id = job_skills.job_id) AND (ee.profile_id = auth.uid())))))
  with check ((exists ( select 1
   from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
  where ((j.id = job_skills.job_id) AND (ee.profile_id = auth.uid())))));

create policy "Competencias de vagas publicadas visiveis" on "public"."job_skills"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.jobs j
  where ((j.id = job_skills.job_id) AND (j.estado = 'publicada'::text)))));

-- applications
create policy "Candidato gere as suas candidaturas" on "public"."applications"
  for all
  to PUBLIC
  using ((auth.uid() = candidate_id))
  with check ((auth.uid() = candidate_id));

create policy "Empresa ve candidaturas as suas vagas" on "public"."applications"
  for select
  to PUBLIC
  using ((exists ( select 1
   from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
  where ((j.id = applications.job_id) AND (ee.profile_id = auth.uid())))));

create policy "Empresa atualiza estado das candidaturas as suas vagas" on "public"."applications"
  for update
  to PUBLIC
  using ((exists ( select 1
   from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
  where ((j.id = applications.job_id) AND (ee.profile_id = auth.uid())))))
  with check ((exists ( select 1
   from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
  where ((j.id = applications.job_id) AND (ee.profile_id = auth.uid())))));

-- application_events (histórico auditável — sem policy de update/delete,
-- fica bloqueado por omissão)
create policy "Ver eventos das proprias candidaturas" on "public"."application_events"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.applications a
  where ((a.id = application_events.application_id)
    AND ((a.candidate_id = auth.uid())
      OR (exists ( select 1
       from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
      where ((j.id = a.job_id) AND (ee.profile_id = auth.uid())))))))));

create policy "Criar eventos nas proprias candidaturas" on "public"."application_events"
  for insert
  to PUBLIC
  with check ((exists ( select 1
   from public.applications a
  where ((a.id = application_events.application_id)
    AND ((a.candidate_id = auth.uid())
      OR (exists ( select 1
       from (public.jobs j join public.empregos_empresas ee on ((ee.id = j.empresa_id)))
      where ((j.id = a.job_id) AND (ee.profile_id = auth.uid())))))))));

-- saved_jobs
create policy "Candidato gere as vagas guardadas" on "public"."saved_jobs"
  for all
  to PUBLIC
  using ((auth.uid() = candidate_id))
  with check ((auth.uid() = candidate_id));


-- ------------------------------------------------------------
-- 5) GRANTS (mesmo padrão do resto do projeto — RLS é que
--    restringe de facto o acesso, os grants são de tabela)
-- ------------------------------------------------------------

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."skills" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."candidate_profiles" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."candidate_skills" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."empregos_empresas" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."jobs" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."job_skills" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."applications" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."application_events" to "anon", "authenticated", "postgres", "service_role";
grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."saved_jobs" to "anon", "authenticated", "postgres", "service_role";


-- ------------------------------------------------------------
-- 6) entidade_pedidos.tipo_entidade -- alargar CHECK com 'empregador'
-- ------------------------------------------------------------

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_tipo_entidade_check";

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_tipo_entidade_check"
  check ((tipo_entidade = ANY (ARRAY['municipio'::text, 'freguesia'::text, 'organismo_publico'::text, 'outro'::text, 'stand_automovel'::text, 'empregador'::text])));


-- ------------------------------------------------------------
-- 7) notifications.type -- alargar CHECK com job_application, job_alert
-- ------------------------------------------------------------

alter table "public"."notifications"
  drop constraint "notifications_type_check";

alter table "public"."notifications"
  add constraint "notifications_type_check"
  check ((type = ANY (ARRAY['reply'::text, 'mention'::text, 'like'::text, 'message'::text, 'call'::text, 'group_invite'::text, 'job_application'::text, 'job_alert'::text])));


-- ------------------------------------------------------------
-- 8) Catálogo inicial de competências (seed pequeno, idempotente,
--    só para o módulo não nascer com o catálogo vazio -- fácil de
--    o Yos editar/completar depois pelo admin, quando existir)
-- ------------------------------------------------------------

insert into "public"."skills" ("nome", "slug") values
  ('Atendimento ao cliente', 'atendimento-ao-cliente'),
  ('Comunicação', 'comunicacao'),
  ('Contabilidade', 'contabilidade'),
  ('Condução profissional', 'conducao-profissional'),
  ('Construção civil', 'construcao-civil'),
  ('Cozinha', 'cozinha'),
  ('Design gráfico', 'design-grafico'),
  ('Eletricidade', 'eletricidade'),
  ('Enfermagem', 'enfermagem'),
  ('Excel', 'excel'),
  ('Gestão de equipas', 'gestao-de-equipas'),
  ('Gestão de projetos', 'gestao-de-projetos'),
  ('Hotelaria', 'hotelaria'),
  ('Idiomas — inglês', 'idiomas-ingles'),
  ('Idiomas — francês', 'idiomas-frances'),
  ('Idiomas — espanhol', 'idiomas-espanhol'),
  ('Jardinagem e agricultura', 'jardinagem-e-agricultura'),
  ('Limpeza e manutenção', 'limpeza-e-manutencao'),
  ('Logística e armazém', 'logistica-e-armazem'),
  ('Marketing digital', 'marketing-digital'),
  ('Mecânica automóvel', 'mecanica-automovel'),
  ('Programação — JavaScript', 'programacao-javascript'),
  ('Programação — Python', 'programacao-python'),
  ('Recursos humanos', 'recursos-humanos'),
  ('Vendas', 'vendas')
on conflict (slug) do nothing;
