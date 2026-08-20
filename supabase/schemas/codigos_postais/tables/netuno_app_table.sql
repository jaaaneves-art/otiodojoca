create table "codigos_postais"."netuno_app_table" (
  "id"       integer not null,
  "uid"      uuid,
  "app_id"   integer default 0,
  "table_id" integer default 0
);

alter table "codigos_postais"."netuno_app_table"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app_table" to "postgres";
