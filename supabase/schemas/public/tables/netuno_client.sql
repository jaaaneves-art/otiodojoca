create table "public"."netuno_client" (
  "id"     integer                not null,
  "name"   character varying(250) default ''::character varying,
  "token"  character varying(250) default ''::character varying,
  "secret" character varying(250) default ''::character varying,
  "active" boolean                default true,
  constraint "netuno_client_pkey" primary key (id)
);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_client" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_client"
  add column "uid" uuid default public.uuid_generate_v4();
