create table "codigos_postais"."concelho" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "distrito_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."concelho"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."concelho" to "postgres";
