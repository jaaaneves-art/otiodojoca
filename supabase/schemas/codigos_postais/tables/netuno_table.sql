create table "codigos_postais"."netuno_table" (
  "id"                integer                not null,
  "uid"               uuid,
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
  "firebase"          character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_table"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_table" to "postgres";
