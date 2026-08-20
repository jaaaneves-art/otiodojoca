create table "codigos_postais"."netuno_statistic_type" (
  "id"   integer                not null,
  "uid"  uuid,
  "code" character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_statistic_type"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_type" to "postgres";
