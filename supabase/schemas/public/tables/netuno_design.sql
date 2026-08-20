create table "public"."netuno_design" (
  "id"            integer                not null,
  "table_id"      integer                default 0,
  "name"          character varying(250) default ''::character varying,
  "displayname"   character varying(250) default ''::character varying,
  "description"   text,
  "x"             integer                default 0,
  "y"             integer                default 0,
  "type"          character varying(50)  default ''::character varying,
  "width"         integer                default 0,
  "height"        integer                default 0,
  "max"           integer                default 0,
  "min"           integer                default 0,
  "colspan"       integer                default 0,
  "rowspan"       integer                default 0,
  "tdwidth"       integer                default 0,
  "tdheight"      integer                default 0,
  "notnull"       boolean                default false,
  "primarykey"    boolean                default false,
  "whenresult"    boolean                default true,
  "whenfilter"    boolean                default true,
  "whenedit"      boolean                default true,
  "whenview"      boolean                default true,
  "whennew"       boolean                default true,
  "whenexport"    boolean                default true,
  "user_id"       integer                default 0,
  "group_id"      integer                default 0,
  "view_user_id"  integer                default 0,
  "view_group_id" integer                default 0,
  "edit_user_id"  integer                default 0,
  "edit_group_id" integer                default 0,
  "properties"    text                   default ''::text,
  "firebase"      character varying(250) default ''::character varying,
  constraint "netuno_design_pkey" primary key (id)
);

create index netuno_design_table_id_idx on public.netuno_design using btree (table_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_design" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_design"
  add column "uid" uuid default public.uuid_generate_v4();
