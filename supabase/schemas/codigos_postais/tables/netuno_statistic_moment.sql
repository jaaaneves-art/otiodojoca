create table "codigos_postais"."netuno_statistic_moment" (
  "id"      integer                     not null,
  "uid"     uuid,
  "type_id" integer                     default 0,
  "moment"  timestamp without time zone default current_timestamp,
  "count"   integer                     default 0
);

alter table "codigos_postais"."netuno_statistic_moment"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_moment" to "postgres";
