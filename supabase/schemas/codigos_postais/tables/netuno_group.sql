create table "codigos_postais"."netuno_group" (
  "id"           integer                not null,
  "uid"          uuid,
  "name"         character varying(250) default ''::character varying,
  "netuno_group" integer                default 0,
  "active"       boolean                default true,
  "report"       text                   default ''::text,
  "code"         character varying(250) default ''::character varying,
  "mail"         character varying(250) default ''::character varying,
  "config"       text                   default ''::text,
  "extra"        text                   default ''::text
);

alter table "codigos_postais"."netuno_group"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_group" to "postgres";
