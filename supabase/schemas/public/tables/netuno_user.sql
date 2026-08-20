create table "public"."netuno_user" (
  "id"       integer                not null,
  "name"     character varying(250) default ''::character varying,
  "group_id" integer                default 0,
  "user"     character varying(250) default ''::character varying,
  "pass"     character varying(250) default ''::character varying,
  "active"   boolean                default true,
  "report"   text                   default ''::text,
  "code"     character varying(250) default ''::character varying,
  "mail"     character varying(250) default ''::character varying,
  "config"   text                   default ''::text,
  "extra"    text                   default ''::text,
  constraint "netuno_user_pkey" primary key (id)
);

create index netuno_user_group_id_idx on public.netuno_user using btree (group_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_user" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_user"
  add column "uid" uuid default public.uuid_generate_v4();
