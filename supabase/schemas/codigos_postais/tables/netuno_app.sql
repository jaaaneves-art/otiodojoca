create table "codigos_postais"."netuno_app" (
  "id"     integer                not null,
  "uid"    uuid,
  "name"   character varying(250) default ''::character varying,
  "config" text                   default ''::text,
  "extra"  text                   default ''::text
);

alter table "codigos_postais"."netuno_app"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app" to "postgres";
