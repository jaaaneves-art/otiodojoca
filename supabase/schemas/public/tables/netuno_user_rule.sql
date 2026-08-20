create table "public"."netuno_user_rule" (
  "id"          integer not null,
  "user_id"     integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0,
  constraint "netuno_user_rule_pkey" primary key (id)
);

create index netuno_user_rule_table_id_idx on public.netuno_user_rule using btree (table_id);

create index netuno_user_rule_user_id_idx on public.netuno_user_rule using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_user_rule" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_user_rule"
  add column "uid" uuid default public.uuid_generate_v4();
