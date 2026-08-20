create table "public"."netuno_statistic_average" (
  "id"              integer                     not null,
  "type_id"         integer                     default 0,
  "average_type_id" integer                     default 0,
  "moment"          timestamp without time zone default current_timestamp,
  "average"         integer                     default 0,
  constraint "netuno_statistic_average_pkey" primary key (id)
);

create index netuno_statistic_average_type_id_idx on public.netuno_statistic_average using btree (type_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_statistic_average" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_statistic_average"
  add column "uid" uuid default public.uuid_generate_v4();
