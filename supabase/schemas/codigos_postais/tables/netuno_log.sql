create table "codigos_postais"."netuno_log" (
  "id"       integer                     not null,
  "uid"      uuid,
  "user_id"  integer                     default 0,
  "group_id" integer                     default 0,
  "moment"   timestamp without time zone default current_timestamp,
  "action"   integer                     default 0,
  "table_id" integer                     default 0,
  "item_id"  integer                     default 0,
  "data"     text                        default ''::text
);

alter table "codigos_postais"."netuno_log"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_log" to "postgres";
