create table "codigos_postais"."netuno_client_hit" (
  "id"        integer                     not null,
  "uid"       uuid,
  "client_id" integer                     default 0,
  "user_id"   integer                     default 0,
  "moment"    timestamp without time zone default current_timestamp
);

alter table "codigos_postais"."netuno_client_hit"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_client_hit" to "postgres";
