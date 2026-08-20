create table "public"."netuno_statistic_average_type" (
  "id"   integer                not null,
  "code" character varying(250) default ''::character varying,
  constraint "netuno_statistic_average_type_pkey" primary key (id)
);

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."netuno_statistic_average_type"
  to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_statistic_average_type"
  add column "uid" uuid default public.uuid_generate_v4();
