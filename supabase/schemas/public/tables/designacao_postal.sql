create table "public"."designacao_postal" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "designacao"         character varying(250)      default ''::character varying,
  constraint "designacao_postal_pkey" primary key (id)
);

create index designacao_postal_group_id_idx on public.designacao_postal using btree (group_id);

create index designacao_postal_lastchange_user_id_idx on public.designacao_postal using btree (lastchange_user_id);

create index designacao_postal_user_id_idx on public.designacao_postal using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."designacao_postal" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."designacao_postal"
  add column "uid" uuid default public.uuid_generate_v4();
