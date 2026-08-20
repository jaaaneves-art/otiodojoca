create table "public"."netuno_table" (
  "id"                integer                not null,
  "name"              character varying(250) default ''::character varying,
  "displayname"       character varying(250) default ''::character varying,
  "description"       text,
  "user_id"           integer                default 0,
  "group_id"          integer                default 0,
  "js"                text,
  "report"            boolean                default false,
  "show_id"           boolean                default true,
  "control_active"    boolean                default true,
  "control_user"      boolean                default false,
  "control_group"     boolean                default false,
  "export_xls"        boolean                default true,
  "export_xml"        boolean                default true,
  "export_json"       boolean                default true,
  "export_id"         boolean                default true,
  "export_uid"        boolean                default true,
  "export_lastchange" boolean                default true,
  "big"               boolean                default false,
  "parent_id"         integer                default 0,
  "reorder"           integer                default 0,
  "firebase"          character varying(250) default ''::character varying,
  constraint "netuno_table_pkey" primary key (id)
);

create index netuno_table_group_id_idx on public.netuno_table using btree (group_id);

create index netuno_table_parent_id_idx on public.netuno_table using btree (parent_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_table" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_table"
  add column "uid" uuid default public.uuid_generate_v4();
