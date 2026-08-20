create table "public"."plantacoes" (
  "id"                          bigint                   generated always as identity not null,
  "utilizador_id"               uuid                     not null,
  "cultura_id"                  uuid                     not null,
  "localizacao_id"              bigint,
  "local_nome"                  text,
  "data_plantacao"              date                     not null,
  "data_colheita_prevista"      date,
  "data_colheita_real"          date,
  "estado"                      text                     not null default 'plantada'::text,
  "fenologia"                   text,
  "fase_lunar_plantacao"        text,
  "temperatura_media_plantacao" numeric,
  "humidade_media_plantacao"    numeric,
  "notas"                       text,
  "fotografias"                 jsonb                    default '[]'::jsonb,
  "origem"                      text                     default 'utilizador'::text,
  "criado_em"                   timestamp with time zone default now(),
  "atualizado_em"               timestamp with time zone default now(),
  constraint "plantacoes_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete restrict,
  constraint "plantacoes_pkey" primary key (id),
  constraint "plantacoes_utilizador_id_fkey" foreign key (utilizador_id) references auth.users(id) on delete cascade
);

alter table "public"."plantacoes"
  enable row level security;

create policy "plantacoes_user_access" on "public"."plantacoes"
  for all
  to PUBLIC
  using ((auth.uid() = utilizador_id));

create policy "users_can_create_own_plantacoes" on "public"."plantacoes"
  for insert
  to PUBLIC
  with check ((auth.uid() = utilizador_id));

create policy "users_can_delete_own_plantacoes" on "public"."plantacoes"
  for delete
  to PUBLIC
  using ((auth.uid() = utilizador_id));

create policy "users_can_update_own_plantacoes" on "public"."plantacoes"
  for update
  to PUBLIC
  using ((auth.uid() = utilizador_id))
  with check ((auth.uid() = utilizador_id));

create policy "users_can_view_own_plantacoes" on "public"."plantacoes"
  for select
  to PUBLIC
  using ((auth.uid() = utilizador_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."plantacoes" to "anon", "authenticated", "postgres", "service_role";
