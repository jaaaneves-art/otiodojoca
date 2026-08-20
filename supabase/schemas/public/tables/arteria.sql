create table "public"."arteria" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_id"          integer                     default 0,
  "tipo_id"            integer                     default 0,
  "titulo_id"          integer                     default 0,
  "nome_id"            integer                     default 0,
  "local_id"           integer                     default 0,
  constraint "arteria_pkey" primary key (id)
);

create index arteria_codigo_id_idx on public.arteria using btree (codigo_id);

create index arteria_group_id_idx on public.arteria using btree (group_id);

create index arteria_lastchange_user_id_idx on public.arteria using btree (lastchange_user_id);

create index arteria_local_id_idx on public.arteria using btree (local_id);

create index arteria_nome_id_idx on public.arteria using btree (nome_id);

create index arteria_tipo_id_idx on public.arteria using btree (tipo_id);

create index arteria_titulo_id_idx on public.arteria using btree (titulo_id);

create index arteria_user_id_idx on public.arteria using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."arteria"
  add column "uid" uuid default public.uuid_generate_v4();
