create table "public"."arteria_nome" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "nome"               character varying(250)      default ''::character varying,
  constraint "arteria_nome_pkey" primary key (id)
);

create index arteria_nome_group_id_idx on public.arteria_nome using btree (group_id);

create index arteria_nome_lastchange_user_id_idx on public.arteria_nome using btree (lastchange_user_id);

create index arteria_nome_user_id_idx on public.arteria_nome using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_nome" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."arteria_nome"
  add column "uid" uuid default public.uuid_generate_v4();
