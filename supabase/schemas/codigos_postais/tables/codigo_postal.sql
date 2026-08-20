create table "codigos_postais"."codigo_postal" (
  "id"                  integer                     not null,
  "uid"                 uuid,
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
  "arteria_id"          integer                     default 0
);

alter table "codigos_postais"."codigo_postal"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."codigo_postal" to "postgres";
