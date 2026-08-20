create table "public"."concelho" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "distrito_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying,
  constraint "concelho_pkey" primary key (id)
);

create index concelho_distrito_id_idx on public.concelho using btree (distrito_id);

create index concelho_group_id_idx on public.concelho using btree (group_id);

create index concelho_lastchange_user_id_idx on public.concelho using btree (lastchange_user_id);

create index concelho_user_id_idx on public.concelho using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."concelho" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."concelho"
  add column "uid" uuid default public.uuid_generate_v4();
