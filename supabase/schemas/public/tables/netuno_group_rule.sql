create table "public"."netuno_group_rule" (
  "id"          integer not null,
  "group_id"    integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0,
  constraint "netuno_group_rule_pkey" primary key (id)
);

create index netuno_group_rule_group_id_idx on public.netuno_group_rule using btree (group_id);

create index netuno_group_rule_table_id_idx on public.netuno_group_rule using btree (table_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_group_rule" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_group_rule"
  add column "uid" uuid default public.uuid_generate_v4();
