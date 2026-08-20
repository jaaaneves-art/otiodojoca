create table "codigos_postais"."netuno_group_rule" (
  "id"          integer not null,
  "uid"         uuid,
  "group_id"    integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0
);

alter table "codigos_postais"."netuno_group_rule"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_group_rule" to "postgres";
