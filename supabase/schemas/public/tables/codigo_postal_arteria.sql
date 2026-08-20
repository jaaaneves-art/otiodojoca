create table "public"."codigo_postal_arteria" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_postal_id"   integer                     default 0,
  "arteria_id"         integer                     default 0,
  constraint "codigo_postal_arteria_pkey" primary key (id)
);

create index codigo_postal_arteria_arteria_id_idx on public.codigo_postal_arteria using btree (arteria_id);

create index codigo_postal_arteria_codigo_postal_id_idx on public.codigo_postal_arteria using btree (codigo_postal_id);

create index codigo_postal_arteria_group_id_idx on public.codigo_postal_arteria using btree (group_id);

create index codigo_postal_arteria_lastchange_user_id_idx on public.codigo_postal_arteria using btree (lastchange_user_id);

create index codigo_postal_arteria_user_id_idx on public.codigo_postal_arteria using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigo_postal_arteria" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."codigo_postal_arteria"
  add column "uid" uuid default public.uuid_generate_v4();
