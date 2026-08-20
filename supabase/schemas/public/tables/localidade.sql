create table "public"."localidade" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "concelho_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying,
  constraint "localidade_pkey" primary key (id)
);

create index localidade_concelho_id_idx on public.localidade using btree (concelho_id);

create index localidade_group_id_idx on public.localidade using btree (group_id);

create index localidade_lastchange_user_id_idx on public.localidade using btree (lastchange_user_id);

create index localidade_user_id_idx on public.localidade using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."localidade" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."localidade"
  add column "uid" uuid default public.uuid_generate_v4();
