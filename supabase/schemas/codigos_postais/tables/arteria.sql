create table "codigos_postais"."arteria" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_id"          integer                     default 0,
  "tipo_id"            integer                     default 0,
  "titulo_id"          integer                     default 0,
  "nome_id"            integer                     default 0,
  "local_id"           integer                     default 0
);

alter table "codigos_postais"."arteria"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria" to "postgres";
