create table "public"."arteria_tipo" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "tipo"               character varying(250)      default ''::character varying,
  constraint "arteria_tipo_pkey" primary key (id)
);

create index arteria_tipo_group_id_idx on public.arteria_tipo using btree (group_id);

create index arteria_tipo_lastchange_user_id_idx on public.arteria_tipo using btree (lastchange_user_id);

create index arteria_tipo_user_id_idx on public.arteria_tipo using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_tipo" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."arteria_tipo"
  add column "uid" uuid default public.uuid_generate_v4();
