create table "codigos_postais"."netuno_user" (
  "id"       integer                not null,
  "uid"      uuid,
  "name"     character varying(250) default ''::character varying,
  "group_id" integer                default 0,
  "user"     character varying(250) default ''::character varying,
  "pass"     character varying(250) default ''::character varying,
  "active"   boolean                default true,
  "report"   text                   default ''::text,
  "code"     character varying(250) default ''::character varying,
  "mail"     character varying(250) default ''::character varying,
  "config"   text                   default ''::text,
  "extra"    text                   default ''::text
);

alter table "codigos_postais"."netuno_user"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_user" to "postgres";
