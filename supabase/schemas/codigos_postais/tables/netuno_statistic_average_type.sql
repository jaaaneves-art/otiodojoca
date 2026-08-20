create table "codigos_postais"."netuno_statistic_average_type" (
  "id"   integer                not null,
  "uid"  uuid,
  "code" character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_statistic_average_type"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_average_type" to "postgres";
