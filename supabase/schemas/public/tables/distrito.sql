create table "public"."distrito" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "nome"               character varying(250)      default ''::character varying,
  constraint "distrito_pkey" primary key (id)
);

create index distrito_group_id_idx on public.distrito using btree (group_id);

create index distrito_lastchange_user_id_idx on public.distrito using btree (lastchange_user_id);

create index distrito_user_id_idx on public.distrito using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."distrito" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."distrito"
  add column "uid" uuid default public.uuid_generate_v4();
