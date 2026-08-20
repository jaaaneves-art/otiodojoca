create table "codigos_postais"."netuno_statistic_average" (
  "id"              integer                     not null,
  "uid"             uuid,
  "type_id"         integer                     default 0,
  "average_type_id" integer                     default 0,
  "moment"          timestamp without time zone default current_timestamp,
  "average"         integer                     default 0
);

alter table "codigos_postais"."netuno_statistic_average"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_average" to "postgres";
