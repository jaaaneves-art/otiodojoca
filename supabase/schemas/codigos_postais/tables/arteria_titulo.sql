create table "codigos_postais"."arteria_titulo" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "titulo"             character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_titulo"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_titulo" to "postgres";
