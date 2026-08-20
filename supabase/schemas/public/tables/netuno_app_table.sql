create table "public"."netuno_app_table" (
  "id"       integer not null,
  "app_id"   integer default 0,
  "table_id" integer default 0,
  constraint "netuno_app_table_pkey" primary key (id)
);

create index netuno_app_table_app_id_idx on public.netuno_app_table using btree (app_id);

create index netuno_app_table_table_id_idx on public.netuno_app_table using btree (table_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app_table" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_app_table"
  add column "uid" uuid default public.uuid_generate_v4();
