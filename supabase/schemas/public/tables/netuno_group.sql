create table "public"."netuno_group" (
  "id"           integer                not null,
  "name"         character varying(250) default ''::character varying,
  "netuno_group" integer                default 0,
  "active"       boolean                default true,
  "report"       text                   default ''::text,
  "code"         character varying(250) default ''::character varying,
  "mail"         character varying(250) default ''::character varying,
  "config"       text                   default ''::text,
  "extra"        text                   default ''::text,
  constraint "netuno_group_pkey" primary key (id)
);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_group" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_group"
  add column "uid" uuid default public.uuid_generate_v4();
