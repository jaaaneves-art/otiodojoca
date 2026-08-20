create table "public"."netuno_app_meta" (
  "id"    integer                not null,
  "key"   character varying(250) default ''::character varying,
  "value" text                   default ''::text,
  constraint "netuno_app_meta_pkey" primary key (id)
);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app_meta" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_app_meta"
  add column "uid" uuid default public.uuid_generate_v4();
