create table "public"."netuno_log" (
  "id"       integer                     not null,
  "user_id"  integer                     default 0,
  "group_id" integer                     default 0,
  "moment"   timestamp without time zone default current_timestamp,
  "action"   integer                     default 0,
  "table_id" integer                     default 0,
  "item_id"  integer                     default 0,
  "data"     text                        default ''::text,
  constraint "netuno_log_pkey" primary key (id)
);

create index netuno_log_group_id_idx on public.netuno_log using btree (group_id);

create index netuno_log_item_id_idx on public.netuno_log using btree (item_id);

create index netuno_log_table_id_idx on public.netuno_log using btree (table_id);

create index netuno_log_user_id_idx on public.netuno_log using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_log" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_log"
  add column "uid" uuid default public.uuid_generate_v4();
