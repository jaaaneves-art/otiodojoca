create table "public"."netuno_app" (
  "id"     integer                not null,
  "name"   character varying(250) default ''::character varying,
  "config" text                   default ''::text,
  "extra"  text                   default ''::text,
  constraint "netuno_app_pkey" primary key (id)
);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_app"
  add column "uid" uuid default public.uuid_generate_v4();
