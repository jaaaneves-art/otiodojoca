create table "public"."codigo_postal" (
  "id"                  integer                     not null,
  "user_id"             integer                     default 0,
  "group_id"            integer                     default 0,
  "lastchange_time"     timestamp without time zone default current_timestamp,
  "lastchange_user_id"  integer                     default 0,
  "active"              boolean                     default true,
  "lock"                boolean                     default false,
  "extensao"            character varying(250)      default ''::character varying,
  "gps_processado"      boolean                     default false,
  "latitude"            character varying(250)      default ''::character varying,
  "localidade_id"       integer                     default 0,
  "longitude"           character varying(250)      default ''::character varying,
  "numero"              character varying(250)      default ''::character varying,
  "gps_bing_processado" boolean                     default false,
  "arteria_id"          integer                     default 0,
  constraint "codigo_postal_pkey" primary key (id)
);

create index codigo_postal_arteria_id_idx on public.codigo_postal using btree (arteria_id);

create index codigo_postal_group_id_idx on public.codigo_postal using btree (group_id);

create index codigo_postal_lastchange_user_id_idx on public.codigo_postal using btree (lastchange_user_id);

create index codigo_postal_localidade_id_idx on public.codigo_postal using btree (localidade_id);

create index codigo_postal_user_id_idx on public.codigo_postal using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigo_postal" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."codigo_postal"
  add column "uid" uuid default public.uuid_generate_v4();
