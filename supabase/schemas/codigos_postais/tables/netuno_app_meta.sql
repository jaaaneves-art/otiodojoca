create table "codigos_postais"."netuno_app_meta" (
  "id"    integer                not null,
  "uid"   uuid,
  "key"   character varying(250) default ''::character varying,
  "value" text                   default ''::text
);

alter table "codigos_postais"."netuno_app_meta"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app_meta" to "postgres";
