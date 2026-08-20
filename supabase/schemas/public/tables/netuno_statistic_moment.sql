create table "public"."netuno_statistic_moment" (
  "id"      integer                     not null,
  "type_id" integer                     default 0,
  "moment"  timestamp without time zone default current_timestamp,
  "count"   integer                     default 0,
  constraint "netuno_statistic_moment_pkey" primary key (id)
);

create index netuno_statistic_moment_type_id_idx on public.netuno_statistic_moment using btree (type_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_statistic_moment" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_statistic_moment"
  add column "uid" uuid default public.uuid_generate_v4();
