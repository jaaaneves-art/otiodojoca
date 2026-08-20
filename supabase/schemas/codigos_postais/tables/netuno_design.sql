create table "codigos_postais"."netuno_design" (
  "id"            integer                not null,
  "uid"           uuid,
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
  "firebase"      character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_design"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_design" to "postgres";
