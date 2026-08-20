create table "codigos_postais"."netuno_client" (
  "id"     integer                not null,
  "uid"    uuid,
  "name"   character varying(250) default ''::character varying,
  "token"  character varying(250) default ''::character varying,
  "secret" character varying(250) default ''::character varying,
  "active" boolean                default true
);

alter table "codigos_postais"."netuno_client"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_client" to "postgres";
