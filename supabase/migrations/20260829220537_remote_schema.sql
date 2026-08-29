set local check_function_bodies = off;

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

create schema "codigos_postais";

create extension "pg_cron";

create extension "unaccent" schema "public";

create sequence "public"."arteria_codigo_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."arteria_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."arteria_local_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."arteria_nome_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."arteria_tipo_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."arteria_titulo_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."categories_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."codigo_postal_arteria_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."codigo_postal_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."concelho_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."designacao_postal_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."distrito_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."freguesia_audit_id_seq" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."freguesias_id_seq" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."localidade_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_ads_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_categories_id_seq" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_conversations_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_favorites_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_message_attachments_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_messages_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."marketplace_photos_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."municipios_id_seq" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_app_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_app_meta_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_app_table_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_auth_jwt_token_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_client_hit_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_client_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_design_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_group_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_group_rule_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_log_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_statistic_average_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_statistic_average_type_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_statistic_moment_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_statistic_type_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_table_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_user_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."netuno_user_rule_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

create sequence "public"."notifications_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."posts_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."threads_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."username_history_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create table "codigos_postais"."arteria_codigo" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_codigo"
  enable row level security;

create table "codigos_postais"."arteria_local" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "local"              character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_local"
  enable row level security;

create table "codigos_postais"."arteria_nome" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "nome"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_nome"
  enable row level security;

create table "codigos_postais"."arteria_tipo" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "tipo"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_tipo"
  enable row level security;

create table "codigos_postais"."arteria_titulo" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "titulo"             character varying(250)      default ''::character varying
);

alter table "codigos_postais"."arteria_titulo"
  enable row level security;

create table "codigos_postais"."arteria" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_id"          integer                     default 0,
  "tipo_id"            integer                     default 0,
  "titulo_id"          integer                     default 0,
  "nome_id"            integer                     default 0,
  "local_id"           integer                     default 0
);

alter table "codigos_postais"."arteria"
  enable row level security;

create table "codigos_postais"."codigo_postal_arteria" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_postal_id"   integer                     default 0,
  "arteria_id"         integer                     default 0
);

alter table "codigos_postais"."codigo_postal_arteria"
  enable row level security;

create table "codigos_postais"."codigo_postal" (
  "id"                  integer                     not null,
  "uid"                 uuid,
  "user_id"             integer                     default 0,
  "group_id"            integer                     default 0,
  "lastchange_time"     timestamp without time zone default current_timestamp,
  "lastchange_user_id"  integer                     default 0,
  "active"              boolean                     default true,
  "lock"                boolean                     default false,
  "extensao"            character varying(250)      default ''::character varying,
  "gps_processado"      boolean                     default false,
  "latitude"            character varying(250)      default ''::character varying,
  "localidade_id"       integer                     default 0,
  "longitude"           character varying(250)      default ''::character varying,
  "numero"              character varying(250)      default ''::character varying,
  "gps_bing_processado" boolean                     default false,
  "arteria_id"          integer                     default 0
);

alter table "codigos_postais"."codigo_postal"
  enable row level security;

create table "codigos_postais"."concelho" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "distrito_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."concelho"
  enable row level security;

create table "codigos_postais"."designacao_postal" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "designacao"         character varying(250)      default ''::character varying
);

alter table "codigos_postais"."designacao_postal"
  enable row level security;

create table "codigos_postais"."distrito" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "nome"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."distrito"
  enable row level security;

create table "codigos_postais"."localidade" (
  "id"                 integer                     not null,
  "uid"                uuid,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "concelho_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying
);

alter table "codigos_postais"."localidade"
  enable row level security;

create table "codigos_postais"."netuno_app_meta" (
  "id"    integer                not null,
  "uid"   uuid,
  "key"   character varying(250) default ''::character varying,
  "value" text                   default ''::text
);

alter table "codigos_postais"."netuno_app_meta"
  enable row level security;

create table "codigos_postais"."netuno_app_table" (
  "id"       integer not null,
  "uid"      uuid,
  "app_id"   integer default 0,
  "table_id" integer default 0
);

alter table "codigos_postais"."netuno_app_table"
  enable row level security;

create table "codigos_postais"."netuno_app" (
  "id"     integer                not null,
  "uid"    uuid,
  "name"   character varying(250) default ''::character varying,
  "config" text                   default ''::text,
  "extra"  text                   default ''::text
);

alter table "codigos_postais"."netuno_app"
  enable row level security;

create table "codigos_postais"."netuno_client_hit" (
  "id"        integer                     not null,
  "uid"       uuid,
  "client_id" integer                     default 0,
  "user_id"   integer                     default 0,
  "moment"    timestamp without time zone default current_timestamp
);

alter table "codigos_postais"."netuno_client_hit"
  enable row level security;

create table "codigos_postais"."netuno_client" (
  "id"     integer                not null,
  "uid"    uuid,
  "name"   character varying(250) default ''::character varying,
  "token"  character varying(250) default ''::character varying,
  "secret" character varying(250) default ''::character varying,
  "active" boolean                default true
);

alter table "codigos_postais"."netuno_client"
  enable row level security;

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

create table "codigos_postais"."netuno_group_rule" (
  "id"          integer not null,
  "uid"         uuid,
  "group_id"    integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0
);

alter table "codigos_postais"."netuno_group_rule"
  enable row level security;

create table "codigos_postais"."netuno_group" (
  "id"           integer                not null,
  "uid"          uuid,
  "name"         character varying(250) default ''::character varying,
  "netuno_group" integer                default 0,
  "active"       boolean                default true,
  "report"       text                   default ''::text,
  "code"         character varying(250) default ''::character varying,
  "mail"         character varying(250) default ''::character varying,
  "config"       text                   default ''::text,
  "extra"        text                   default ''::text
);

alter table "codigos_postais"."netuno_group"
  enable row level security;

create table "codigos_postais"."netuno_log" (
  "id"       integer                     not null,
  "uid"      uuid,
  "user_id"  integer                     default 0,
  "group_id" integer                     default 0,
  "moment"   timestamp without time zone default current_timestamp,
  "action"   integer                     default 0,
  "table_id" integer                     default 0,
  "item_id"  integer                     default 0,
  "data"     text                        default ''::text
);

alter table "codigos_postais"."netuno_log"
  enable row level security;

create table "codigos_postais"."netuno_statistic_average_type" (
  "id"   integer                not null,
  "uid"  uuid,
  "code" character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_statistic_average_type"
  enable row level security;

create table "codigos_postais"."netuno_statistic_average" (
  "id"              integer                     not null,
  "uid"             uuid,
  "type_id"         integer                     default 0,
  "average_type_id" integer                     default 0,
  "moment"          timestamp without time zone default current_timestamp,
  "average"         integer                     default 0
);

alter table "codigos_postais"."netuno_statistic_average"
  enable row level security;

create table "codigos_postais"."netuno_statistic_moment" (
  "id"      integer                     not null,
  "uid"     uuid,
  "type_id" integer                     default 0,
  "moment"  timestamp without time zone default current_timestamp,
  "count"   integer                     default 0
);

alter table "codigos_postais"."netuno_statistic_moment"
  enable row level security;

create table "codigos_postais"."netuno_statistic_type" (
  "id"   integer                not null,
  "uid"  uuid,
  "code" character varying(250) default ''::character varying
);

alter table "codigos_postais"."netuno_statistic_type"
  enable row level security;

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

create table "codigos_postais"."netuno_user_rule" (
  "id"          integer not null,
  "uid"         uuid,
  "user_id"     integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0
);

alter table "codigos_postais"."netuno_user_rule"
  enable row level security;

create table "codigos_postais"."netuno_user" (
  "id"       integer                not null,
  "uid"      uuid,
  "name"     character varying(250) default ''::character varying,
  "group_id" integer                default 0,
  "user"     character varying(250) default ''::character varying,
  "pass"     character varying(250) default ''::character varying,
  "active"   boolean                default true,
  "report"   text                   default ''::text,
  "code"     character varying(250) default ''::character varying,
  "mail"     character varying(250) default ''::character varying,
  "config"   text                   default ''::text,
  "extra"    text                   default ''::text
);

alter table "codigos_postais"."netuno_user"
  enable row level security;

create table "public"."alojamentos" (
  "id"             bigint                   generated always as identity not null,
  "nome"           text                     not null,
  "descricao"      text,
  "tipo"           character varying        not null,
  "localizacao_id" bigint                   not null,
  "preco_noite"    numeric(10,2)            not null,
  "num_quartos"    integer                  not null,
  "num_camas"      integer,
  "rating"         numeric(3,2),
  "telefone"       character varying,
  "email"          character varying,
  "website"        character varying,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  constraint "alojamentos_num_quartos_check" check ((num_quartos > 0)),
  constraint "alojamentos_pkey" primary key (id),
  constraint "alojamentos_rating_check" check (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);

alter table "public"."alojamentos"
  enable row level security;

create table "public"."arteria_codigo" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  constraint "arteria_codigo_pkey" primary key (id)
);

create table "public"."arteria_local" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "local"              character varying(250)      default ''::character varying,
  constraint "arteria_local_pkey" primary key (id)
);

create table "public"."arteria_nome" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "nome"               character varying(250)      default ''::character varying,
  constraint "arteria_nome_pkey" primary key (id)
);

create table "public"."arteria_tipo" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "tipo"               character varying(250)      default ''::character varying,
  constraint "arteria_tipo_pkey" primary key (id)
);

create table "public"."arteria_titulo" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "titulo"             character varying(250)      default ''::character varying,
  constraint "arteria_titulo_pkey" primary key (id)
);

create table "public"."arteria" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_id"          integer                     default 0,
  "tipo_id"            integer                     default 0,
  "titulo_id"          integer                     default 0,
  "nome_id"            integer                     default 0,
  "local_id"           integer                     default 0,
  constraint "arteria_pkey" primary key (id)
);

create table "public"."audit_log" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid,
  "action"     text                     not null,
  "success"    boolean                  not null default true,
  "ip"         inet,
  "user_agent" text,
  "details"    jsonb,
  "created_at" timestamp with time zone not null default now(),
  constraint "audit_log_pkey" primary key (id)
);

alter table "public"."audit_log"
  enable row level security;

create table "public"."calendar_categories" (
  "id"          uuid                     not null default gen_random_uuid(),
  "name"        text                     not null,
  "slug"        text                     not null,
  "description" text,
  "color"       text,
  "icon"        text,
  "sort_order"  integer                  default 0,
  "is_active"   boolean                  default true,
  "created_at"  timestamp with time zone default now(),
  "updated_at"  timestamp with time zone default now(),
  constraint "calendar_categories_pkey" primary key (id),
  constraint "calendar_categories_slug_key" unique (slug)
);

alter table "public"."calendar_categories"
  enable row level security;

create table "public"."calendar_event_favorites" (
  "id"         uuid                     not null default gen_random_uuid(),
  "event_id"   uuid                     not null,
  "user_id"    uuid                     not null,
  "created_at" timestamp with time zone default now(),
  constraint "calendar_event_favorites_event_id_user_id_key" unique (event_id, user_id),
  constraint "calendar_event_favorites_pkey" primary key (id)
);

alter table "public"."calendar_event_favorites"
  enable row level security;

create table "public"."calendar_event_images" (
  "id"           uuid                     not null default gen_random_uuid(),
  "event_id"     uuid                     not null,
  "storage_path" text                     not null,
  "file_name"    text,
  "alt_text"     text,
  "is_cover"     boolean                  default false,
  "sort_order"   integer                  default 0,
  "created_at"   timestamp with time zone default now(),
  constraint "calendar_event_images_pkey" primary key (id)
);

alter table "public"."calendar_event_images"
  enable row level security;

create table "public"."calendar_event_participants" (
  "id"         uuid                     not null default gen_random_uuid(),
  "event_id"   uuid                     not null,
  "user_id"    uuid                     not null,
  "status"     text                     default 'confirmed'::text,
  "created_at" timestamp with time zone default now(),
  constraint "calendar_event_participants_event_id_user_id_key" unique (event_id, user_id),
  constraint "calendar_event_participants_pkey" primary key (id)
);

alter table "public"."calendar_event_participants"
  enable row level security;

create table "public"."calendar_events" (
  "id"               uuid                     not null default gen_random_uuid(),
  "category_id"      uuid,
  "created_by"       uuid,
  "title"            text                     not null,
  "slug"             text,
  "description"      text,
  "starts_at"        timestamp with time zone not null,
  "ends_at"          timestamp with time zone not null,
  "all_day"          boolean                  default false,
  "location_name"    text,
  "address"          text,
  "latitude"         numeric(10,7),
  "longitude"        numeric(10,7),
  "municipality"     text,
  "district"         text,
  "visibility"       text                     default 'public'::text,
  "status"           text                     default 'draft'::text,
  "max_participants" integer,
  "is_featured"      boolean                  default false,
  "created_at"       timestamp with time zone default now(),
  "updated_at"       timestamp with time zone default now(),
  constraint "calendar_events_pkey" primary key (id),
  constraint "calendar_events_slug_key" unique (slug)
);

alter table "public"."calendar_events"
  enable row level security;

create table "public"."calendar_reminders" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "event_id"   uuid                     not null,
  "remind_at"  timestamp with time zone not null,
  "sent"       boolean                  default false,
  "created_at" timestamp with time zone default now(),
  constraint "calendar_reminders_pkey" primary key (id)
);

alter table "public"."calendar_reminders"
  enable row level security;

create table "public"."calendar_user_calendar" (
  "id"               uuid                     not null default gen_random_uuid(),
  "user_id"          uuid                     not null,
  "event_id"         uuid                     not null,
  "reminder_minutes" integer,
  "created_at"       timestamp with time zone default now(),
  constraint "calendar_user_calendar_pkey" primary key (id),
  constraint "calendar_user_calendar_user_id_event_id_key" unique (user_id, event_id)
);

alter table "public"."calendar_user_calendar"
  enable row level security;

create table "public"."categorias_entidade" (
  "id"                 bigint                   generated always as identity not null,
  "nome"               text                     not null,
  "slug"               text                     not null,
  "descricao"          text,
  "icone"              text,
  "cor_tema"           text,
  "ordem_apresentacao" integer                  default 0,
  "created_at"         timestamp with time zone not null default now(),
  "updated_at"         timestamp with time zone not null default now(),
  constraint "categorias_entidade_nome_key" unique (nome),
  constraint "categorias_entidade_pkey" primary key (id),
  constraint "categorias_entidade_slug_key" unique (slug)
);

alter table "public"."categorias_entidade"
  enable row level security;

create table "public"."categories" (
  "id"          integer                  not null default nextval('public.categories_id_seq'::regclass),
  "name"        text                     not null,
  "slug"        text                     not null,
  "type"        text                     not null,
  "parent_id"   integer,
  "description" text,
  "icon"        text                     default '🌱'::text,
  "sort_order"  integer                  default 0,
  "created_at"  timestamp with time zone default now(),
  constraint "categories_pkey" primary key (id),
  constraint "categories_slug_key" unique (slug),
  constraint "categories_type_check"
    check ((type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text, 'bazar'::text, 'lup'::text, 'viaturas'::text, 'imoveis'::text])))
);

alter table "public"."categories"
  enable row level security;

create table "public"."codigo_postal_arteria" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo_postal_id"   integer                     default 0,
  "arteria_id"         integer                     default 0,
  constraint "codigo_postal_arteria_pkey" primary key (id)
);

create table "public"."codigo_postal" (
  "id"                  integer                     not null,
  "user_id"             integer                     default 0,
  "group_id"            integer                     default 0,
  "lastchange_time"     timestamp without time zone default current_timestamp,
  "lastchange_user_id"  integer                     default 0,
  "active"              boolean                     default true,
  "lock"                boolean                     default false,
  "extensao"            character varying(250)      default ''::character varying,
  "gps_processado"      boolean                     default false,
  "latitude"            character varying(250)      default ''::character varying,
  "localidade_id"       integer                     default 0,
  "longitude"           character varying(250)      default ''::character varying,
  "numero"              character varying(250)      default ''::character varying,
  "gps_bing_processado" boolean                     default false,
  "arteria_id"          integer                     default 0,
  constraint "codigo_postal_pkey" primary key (id)
);

create table "public"."codigos_postais_geo" (
  "codigo_postal" character varying(8) not null,
  "latitude"      double precision     not null,
  "longitude"     double precision     not null,
  constraint "codigos_postais_geo_codigo_postal_check" check (((codigo_postal)::text ~ '^[0-9]{4}-[0-9]{3}$'::text)),
  constraint "codigos_postais_geo_latitude_check" check (((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision))),
  constraint "codigos_postais_geo_longitude_check" check (((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision))),
  constraint "codigos_postais_geo_pkey" primary key (codigo_postal)
);

alter table "public"."codigos_postais_geo"
  enable row level security;

create table "public"."concelho" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "distrito_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying,
  constraint "concelho_pkey" primary key (id)
);

create table "public"."culturas_aptidoes" (
  "id"               uuid                        not null default gen_random_uuid(),
  "cultura_id"       uuid                        not null,
  "aptidao"          character varying           not null,
  "descricao"        text,
  "peso_importancia" integer                     default 1,
  "created_at"       timestamp without time zone default now(),
  constraint "culturas_aptidoes_cultura_id_aptidao_key" unique (cultura_id, aptidao),
  constraint "culturas_aptidoes_pkey" primary key (id)
);

create table "public"."culturas_guia_backup_20260819" (
  "id"                    uuid,
  "nome"                  text,
  "nome_cientifico"       text,
  "categoria"             text,
  "ciclo_dias_min"        integer,
  "ciclo_dias_max"        integer,
  "semeadura_fase_lunar"  text,
  "poda_fase_lunar"       text,
  "colheita_fase_lunar"   text,
  "meses_semeadura"       text,
  "meses_colheita"        text,
  "temp_min_germinacao"   numeric,
  "temp_otima"            numeric,
  "humidade_ideal"        text,
  "descricao"             text,
  "associacoes_beneficas" text,
  "dicas"                 text,
  "criado_em"             timestamp with time zone,
  "atualizado_em"         timestamp with time zone
);

alter table "public"."culturas_guia_backup_20260819"
  enable row level security;

create table "public"."culturas_guia_backup_20260820" (
  "id"                    uuid,
  "nome"                  text,
  "nome_cientifico"       text,
  "categoria"             text,
  "ciclo_dias_min"        integer,
  "ciclo_dias_max"        integer,
  "semeadura_fase_lunar"  text,
  "poda_fase_lunar"       text,
  "colheita_fase_lunar"   text,
  "meses_semeadura"       text,
  "meses_colheita"        text,
  "temp_min_germinacao"   numeric,
  "temp_otima"            numeric,
  "humidade_ideal"        text,
  "descricao"             text,
  "associacoes_beneficas" text,
  "dicas"                 text,
  "criado_em"             timestamp with time zone,
  "atualizado_em"         timestamp with time zone
);

create table "public"."culturas_guia_backup_fase7_20260820" (
  "id"                    uuid,
  "nome"                  text,
  "nome_cientifico"       text,
  "categoria"             text,
  "ciclo_dias_min"        integer,
  "ciclo_dias_max"        integer,
  "semeadura_fase_lunar"  text,
  "poda_fase_lunar"       text,
  "colheita_fase_lunar"   text,
  "meses_semeadura"       text,
  "meses_colheita"        text,
  "temp_min_germinacao"   numeric,
  "temp_otima"            numeric,
  "humidade_ideal"        text,
  "descricao"             text,
  "associacoes_beneficas" text,
  "dicas"                 text,
  "criado_em"             timestamp with time zone,
  "atualizado_em"         timestamp with time zone
);

create table "public"."culturas_guia" (
  "id"                    uuid                        not null default gen_random_uuid(),
  "nome"                  text                        not null,
  "nome_cientifico"       text,
  "categoria"             text                        not null,
  "ciclo_dias_min"        integer,
  "ciclo_dias_max"        integer,
  "semeadura_fase_lunar"  text,
  "poda_fase_lunar"       text,
  "colheita_fase_lunar"   text,
  "meses_semeadura"       text,
  "meses_colheita"        text,
  "temp_min_germinacao"   numeric,
  "temp_otima"            numeric,
  "humidade_ideal"        text,
  "descricao"             text,
  "associacoes_beneficas" text,
  "dicas"                 text,
  "criado_em"             timestamp with time zone    default now(),
  "atualizado_em"         timestamp with time zone    default now(),
  "tipo_cultura"          character varying,
  "subcategoria"          character varying,
  "descricao_estendida"   text,
  "updated_at"            timestamp without time zone default now(),
  constraint "culturas_guia_nome_key" unique (nome),
  constraint "culturas_guia_pkey" primary key (id)
);

alter table "public"."culturas_guia"
  enable row level security;

create table "public"."culturas_produtos" (
  "id"                 uuid                        not null default gen_random_uuid(),
  "cultura_id"         uuid                        not null,
  "produto_nome"       character varying           not null,
  "produto_cientifico" character varying,
  "descricao"          text,
  "peso_importancia"   integer                     default 1,
  "parte_planta"       character varying,
  "created_at"         timestamp without time zone default now(),
  constraint "culturas_produtos_cultura_id_produto_nome_key" unique (cultura_id, produto_nome),
  constraint "culturas_produtos_pkey" primary key (id)
);

create table "public"."designacao_postal" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "designacao"         character varying(250)      default ''::character varying,
  constraint "designacao_postal_pkey" primary key (id)
);

create table "public"."distrito" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "nome"               character varying(250)      default ''::character varying,
  constraint "distrito_pkey" primary key (id)
);

create table "public"."entidade_pedidos" (
  "id"                bigint                   generated always as identity not null,
  "profile_id"        uuid,
  "entidade_id"       bigint,
  "nome_entidade"     text                     not null,
  "categoria_id"      bigint,
  "localizacao_texto" text,
  "contacto_email"    text,
  "contacto_telefone" text,
  "mensagem"          text,
  "estado"            text                     not null default 'pendente'::text,
  "resolvido_por"     uuid,
  "resolvido_em"      timestamp with time zone,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  "tipo_entidade"     text                     not null default 'outro'::text,
  "municipio_id"      bigint,
  "cargo"             text,
  "nipc"              text,
  "freguesia_id"      bigint,
  "codigo_atividade"  text,
  "morada"            text,
  "codigo_postal"     text,
  "localidade"        text,
  "website"           text,
  "presidente_nome"   text,
  "responsavel_nome"  text,
  constraint "entidade_pedidos_estado_check" check ((estado = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text]))),
  constraint "entidade_pedidos_pkey" primary key (id),
  constraint "entidade_pedidos_tipo_entidade_check"
    check ((tipo_entidade = ANY (ARRAY['municipio'::text, 'freguesia'::text, 'organismo_publico'::text, 'outro'::text, 'stand_automovel'::text])))
);

alter table "public"."entidade_pedidos"
  enable row level security;

create table "public"."entidade_relacoes" (
  "id"                  bigint                   generated always as identity not null,
  "entidade_origem_id"  bigint                   not null,
  "tipo_relacao"        text                     not null,
  "entidade_destino_id" bigint                   not null,
  "descricao"           text,
  "data_inicio"         date,
  "data_fim"            date,
  "created_at"          timestamp with time zone not null default now(),
  "updated_at"          timestamp with time zone not null default now(),
  constraint "entidade_relacoes_entidade_origem_id_tipo_relacao_entidade__key" unique (entidade_origem_id, tipo_relacao, entidade_destino_id),
  constraint "entidade_relacoes_pkey" primary key (id),
  constraint "tipo_relacao_valido"
    check
    ((tipo_relacao = ANY (ARRAY['presidente_de'::text, 'vice_presidente_de'::text, 'membro_de'::text, 'parceiro_de'::text, 'organiza_evento'::text, 'colabora_com'::text,
    'filial_de'::text, 'subsecao_de'::text])))
);

alter table "public"."entidade_relacoes"
  enable row level security;

create table "public"."entidades" (
  "id"               bigint                   generated always as identity not null,
  "nome"             text                     not null,
  "slug"             text                     not null,
  "descricao"        text,
  "fotografias"      text[],
  "categoria_id"     bigint                   not null,
  "freguesia_id"     bigint                   not null,
  "lugar"            text,
  "localizacao_id"   bigint,
  "telefone"         text,
  "email"            text,
  "website"          text,
  "redes_sociais"    jsonb,
  "ref_tabela"       character varying(50),
  "ref_id"           uuid,
  "origem"           text,
  "fonte_url"        text,
  "data_verificacao" date,
  "estado"           text                     not null default 'rascunho'::text,
  "criado_por"       text,
  "atualizado_por"   text,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  constraint "entidades_pkey" primary key (id),
  constraint "entidades_ref_tabela_ref_id_key" unique (ref_tabela, ref_id),
  constraint "entidades_slug_key" unique (slug),
  constraint "estado_valido" check ((estado = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'validado'::text, 'publicado'::text, 'desactualizado'::text, 'arquivado'::text])))
);

alter table "public"."entidades"
  enable row level security;

create table "public"."eventos" (
  "id"                       bigint                   generated always as identity not null,
  "nome"                     text                     not null,
  "slug"                     text                     not null,
  "descricao"                text,
  "fotografias"              text[],
  "inicio"                   timestamp with time zone not null,
  "fim"                      timestamp with time zone,
  "freguesia_id"             bigint                   not null,
  "lugar"                    text,
  "localizacao_id"           bigint,
  "entidade_organizadora_id" bigint,
  "tipo"                     text                     not null,
  "telefone"                 text,
  "email"                    text,
  "website"                  text,
  "origem"                   text,
  "estado"                   text                     not null default 'rascunho'::text,
  "criado_por"               text,
  "atualizado_por"           text,
  "created_at"               timestamp with time zone not null default now(),
  "updated_at"               timestamp with time zone not null default now(),
  constraint "datas_logicas" check (((fim IS NULL) OR (inicio < fim))),
  constraint "estado_valido" check ((estado = ANY (ARRAY['rascunho'::text, 'validado'::text, 'publicado'::text, 'cancelado'::text, 'arquivado'::text]))),
  constraint "eventos_pkey" primary key (id),
  constraint "eventos_slug_freguesia_id_inicio_key" unique (slug, freguesia_id, inicio),
  constraint "tipo_valido" check ((tipo = ANY (ARRAY['festa'::text, 'encontro'::text, 'workshop'::text, 'culto'::text, 'desporto'::text, 'cultural'::text, 'outro'::text])))
);

alter table "public"."eventos"
  enable row level security;

create table "public"."freguesia_audit" (
  "id"           bigint                   not null default nextval('public.freguesia_audit_id_seq'::regclass),
  "freguesia_id" bigint,
  "action"       character varying(50),
  "changed_data" jsonb,
  "changed_by"   character varying(255),
  "changed_at"   timestamp with time zone default current_timestamp,
  constraint "freguesia_audit_pkey" primary key (id)
);

alter table "public"."freguesia_audit"
  enable row level security;

create table "public"."freguesias" (
  "id"               bigint                   not null default nextval('public.freguesias_id_seq'::regclass),
  "cod_ine"          character varying(10)    not null,
  "nif"              character varying(20),
  "nome"             character varying(255)   not null,
  "municipio"        character varying(100)   not null,
  "localidade"       character varying(100),
  "morada"           text,
  "codigo_postal"    character varying(20),
  "descricao_postal" character varying(100),
  "email"            character varying(255),
  "telefone"         character varying(50),
  "presidente"       character varying(255),
  "created_at"       timestamp with time zone default current_timestamp,
  "updated_at"       timestamp with time zone default current_timestamp,
  "active"           boolean                  default true,
  constraint "freguesias_cod_ine_key" unique (cod_ine),
  constraint "freguesias_pkey" primary key (id)
);

alter table "public"."freguesias"
  enable row level security;

create table "public"."horarios_excecoes" (
  "id"                bigint                   generated always as identity not null,
  "entidade_id"       bigint                   not null,
  "data_inicio"       date                     not null,
  "data_fim"          date                     not null,
  "motivo"            text                     not null,
  "hora_abertura"     time without time zone,
  "hora_encerramento" time without time zone,
  "criado_por"        text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "horarios_excecoes_pkey" primary key (id),
  constraint "periodo_logico" check ((data_inicio <= data_fim))
);

alter table "public"."horarios_excecoes"
  enable row level security;

create table "public"."horarios" (
  "id"                bigint                   generated always as identity not null,
  "entidade_id"       bigint                   not null,
  "dia_semana"        integer                  not null,
  "hora_abertura"     time without time zone,
  "hora_encerramento" time without time zone,
  "observacoes"       text,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "horarios_dia_semana_check" check (((dia_semana >= 0) AND (dia_semana <= 6))),
  constraint "horarios_entidade_id_dia_semana_key" unique (entidade_id, dia_semana),
  constraint "horarios_pkey" primary key (id),
  constraint "horas_logicas" check ((((hora_abertura IS NULL) AND (hora_encerramento IS NULL)) OR ((hora_abertura IS NOT NULL) AND (hora_encerramento IS
    NOT NULL) AND (hora_abertura < hora_encerramento))))
);

alter table "public"."horarios"
  enable row level security;

create table "public"."localidade" (
  "id"                 integer                     not null,
  "user_id"            integer                     default 0,
  "group_id"           integer                     default 0,
  "lastchange_time"    timestamp without time zone default current_timestamp,
  "lastchange_user_id" integer                     default 0,
  "active"             boolean                     default true,
  "lock"               boolean                     default false,
  "codigo"             character varying(250)      default ''::character varying,
  "concelho_id"        integer                     default 0,
  "nome"               character varying(250)      default ''::character varying,
  constraint "localidade_pkey" primary key (id)
);

create table "public"."localizacoes" (
  "id"            bigint                   generated always as identity not null,
  "codigo_postal" character varying(8)     not null,
  "nome"          text                     not null,
  "localidade"    text                     not null,
  "municipio"     text,
  "distrito"      text,
  "latitude"      double precision,
  "longitude"     double precision,
  "created_at"    timestamp with time zone not null default now(),
  "updated_at"    timestamp with time zone not null default now(),
  "morada"        text,
  constraint "localizacoes_codigo_postal_check" check (((codigo_postal)::text ~ '^[0-9]{4}-[0-9]{3}$'::text)),
  constraint "localizacoes_latitude_check" check (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision)))),
  constraint "localizacoes_longitude_check" check (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))),
  constraint "localizacoes_pkey" primary key (id)
);

alter table "public"."localizacoes"
  enable row level security;

create table "public"."marketplace_ads" (
  "id"             integer                  not null default nextval('public.marketplace_ads_id_seq'::regclass),
  "author_id"      uuid                     not null,
  "category_id"    integer,
  "title"          text                     not null,
  "description"    text,
  "price"          numeric(10,2),
  "price_type"     text                     default 'fixed'::text,
  "location"       text,
  "contact_method" text                     default 'message'::text,
  "contact_info"   text,
  "status"         text                     default 'active'::text,
  "expires_at"     timestamp with time zone default (now() + '30 days'::interval),
  "created_at"     timestamp with time zone default now(),
  "updated_at"     timestamp with time zone default now(),
  "type"           text                     not null default 'sale'::text,
  "details"        jsonb                    not null default '{}'::jsonb,
  "freguesia_id"   bigint,
  "municipio"      character varying(100),
  "module"         text                     not null default 'mercado-da-terra'::text,
  constraint "marketplace_ads_contact_method_check" check ((contact_method = ANY (ARRAY['message'::text, 'phone'::text, 'email'::text, 'in-person'::text]))),
  constraint "marketplace_ads_module_check" check ((module = ANY (ARRAY['mercado-da-terra'::text, 'gran-bazar'::text, 'lup'::text, 'viaturas'::text, 'imoveis'::text]))),
  constraint "marketplace_ads_pkey" primary key (id),
  constraint "marketplace_ads_price_type_check" check ((price_type = ANY (ARRAY['fixed'::text, 'negotiable'::text, 'free'::text]))),
  constraint "marketplace_ads_status_check"
    check
    ((status = ANY (ARRAY['draft'::text, 'active'::text, 'reserved'::text, 'sold'::text, 'traded'::text, 'given'::text, 'expired'::text, 'cancelled'::text, 'inactive'::text])))
);

alter table "public"."marketplace_ads"
  enable row level security;

create table "public"."marketplace_auction_bids" (
  "id"         bigint                   generated always as identity not null,
  "auction_id" bigint                   not null,
  "bidder_id"  uuid                     not null,
  "amount"     numeric(10,2)            not null,
  "created_at" timestamp with time zone not null default now(),
  "request_id" text,
  constraint "marketplace_auction_bids_amount_check" check ((amount > (0)::numeric)),
  constraint "marketplace_auction_bids_pkey" primary key (id)
);

alter table "public"."marketplace_auction_bids"
  enable row level security;

create table "public"."marketplace_auctions" (
  "id"                bigint                   generated always as identity not null,
  "ad_id"             integer                  not null,
  "start_price"       numeric(10,2)            not null,
  "current_price"     numeric(10,2)            not null,
  "minimum_increment" numeric(10,2)            not null default 1.00,
  "starts_at"         timestamp with time zone not null default now(),
  "ends_at"           timestamp with time zone not null,
  "status"            text                     not null default 'scheduled'::text,
  "winner_id"         uuid,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  constraint "marketplace_auctions_ad_id_key" unique (ad_id),
  constraint "marketplace_auctions_current_price_check" check ((current_price >= (0)::numeric)),
  constraint "marketplace_auctions_dates_check" check ((ends_at > starts_at)),
  constraint "marketplace_auctions_minimum_increment_check" check ((minimum_increment > (0)::numeric)),
  constraint "marketplace_auctions_pkey" primary key (id),
  constraint "marketplace_auctions_start_price_check" check ((start_price >= (0)::numeric)),
  constraint "marketplace_auctions_status_check" check ((status = ANY (ARRAY['scheduled'::text, 'live'::text, 'ended'::text, 'cancelled'::text])))
);

alter table "public"."marketplace_auctions"
  enable row level security;

create table "public"."marketplace_categories" (
  "id"         bigint                      not null default nextval('public.marketplace_categories_id_seq'::regclass),
  "name"       character varying(100),
  "slug"       character varying(100),
  "icon"       character varying(50),
  "created_at" timestamp without time zone default now(),
  constraint "marketplace_categories_name_key" unique (name),
  constraint "marketplace_categories_pkey" primary key (id),
  constraint "marketplace_categories_slug_key" unique (slug)
);

alter table "public"."marketplace_categories"
  enable row level security;

create table "public"."marketplace_conversations" (
  "id"         integer                  not null default nextval('public.marketplace_conversations_id_seq'::regclass),
  "ad_id"      integer,
  "buyer_id"   uuid                     not null,
  "seller_id"  uuid                     not null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "module"     text,
  constraint "marketplace_conversations_ad_id_buyer_id_key" unique (ad_id, buyer_id),
  constraint "marketplace_conversations_pkey" primary key (id)
);

alter table "public"."marketplace_conversations"
  enable row level security;

create table "public"."marketplace_favorites" (
  "id"         integer                  not null default nextval('public.marketplace_favorites_id_seq'::regclass),
  "user_id"    uuid                     not null,
  "ad_id"      integer                  not null,
  "created_at" timestamp with time zone default now(),
  constraint "marketplace_favorites_pkey" primary key (id),
  constraint "marketplace_favorites_user_id_ad_id_key" unique (user_id, ad_id)
);

alter table "public"."marketplace_favorites"
  enable row level security;

create table "public"."marketplace_message_attachments" (
  "id"           integer                  not null default nextval('public.marketplace_message_attachments_id_seq'::regclass),
  "message_id"   integer                  not null,
  "storage_path" text                     not null,
  "file_name"    text                     not null,
  "file_type"    text                     not null,
  "created_at"   timestamp with time zone default now(),
  constraint "marketplace_message_attachments_pkey" primary key (id)
);

alter table "public"."marketplace_message_attachments"
  enable row level security;

create table "public"."marketplace_messages" (
  "id"              integer                  not null default nextval('public.marketplace_messages_id_seq'::regclass),
  "conversation_id" integer                  not null,
  "sender_id"       uuid                     not null,
  "content"         text                     not null,
  "read_at"         timestamp with time zone,
  "created_at"      timestamp with time zone default now(),
  constraint "marketplace_messages_pkey" primary key (id)
);

alter table "public"."marketplace_messages"
  enable row level security;

create table "public"."marketplace_photos" (
  "id"           integer                  not null default nextval('public.marketplace_photos_id_seq'::regclass),
  "ad_id"        integer                  not null,
  "storage_path" text                     not null,
  "sort_order"   integer                  default 0,
  "created_at"   timestamp with time zone default now(),
  constraint "marketplace_photos_pkey" primary key (id)
);

alter table "public"."marketplace_photos"
  enable row level security;

create table "public"."municipios" (
  "id"              bigint                   not null default nextval('public.municipios_id_seq'::regclass),
  "codigo_dico"     text,
  "nome"            text                     not null,
  "distrito_regiao" text                     not null,
  "ilha"            text,
  "email_camara"    text,
  "latitude"        numeric,
  "longitude"       numeric,
  "created_at"      timestamp with time zone default now(),
  constraint "municipios_codigo_dico_key" unique (codigo_dico),
  constraint "municipios_pkey" primary key (id)
);

alter table "public"."municipios"
  enable row level security;

create table "public"."netuno_app_meta" (
  "id"    integer                not null,
  "key"   character varying(250) default ''::character varying,
  "value" text                   default ''::text,
  constraint "netuno_app_meta_pkey" primary key (id)
);

create table "public"."netuno_app_table" (
  "id"       integer not null,
  "app_id"   integer default 0,
  "table_id" integer default 0,
  constraint "netuno_app_table_pkey" primary key (id)
);

create table "public"."netuno_app" (
  "id"     integer                not null,
  "name"   character varying(250) default ''::character varying,
  "config" text                   default ''::text,
  "extra"  text                   default ''::text,
  constraint "netuno_app_pkey" primary key (id)
);

create table "public"."netuno_auth_jwt_token" (
  "id"              integer                     not null,
  "user_id"         integer                     default 0,
  "access_token"    text                        default ''::text,
  "refresh_token"   text                        default ''::text,
  "created"         timestamp without time zone default current_timestamp,
  "access_expires"  timestamp without time zone default current_timestamp,
  "refresh_expires" timestamp without time zone default current_timestamp,
  "active"          boolean                     default true,
  constraint "netuno_auth_jwt_token_pkey" primary key (id)
);

create table "public"."netuno_client_hit" (
  "id"        integer                     not null,
  "client_id" integer                     default 0,
  "user_id"   integer                     default 0,
  "moment"    timestamp without time zone default current_timestamp,
  constraint "netuno_client_hit_pkey" primary key (id)
);

create table "public"."netuno_client" (
  "id"     integer                not null,
  "name"   character varying(250) default ''::character varying,
  "token"  character varying(250) default ''::character varying,
  "secret" character varying(250) default ''::character varying,
  "active" boolean                default true,
  constraint "netuno_client_pkey" primary key (id)
);

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

create table "public"."netuno_group_rule" (
  "id"          integer not null,
  "group_id"    integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0,
  constraint "netuno_group_rule_pkey" primary key (id)
);

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

create table "public"."netuno_log" (
  "id"       integer                     not null,
  "user_id"  integer                     default 0,
  "group_id" integer                     default 0,
  "moment"   timestamp without time zone default current_timestamp,
  "action"   integer                     default 0,
  "table_id" integer                     default 0,
  "item_id"  integer                     default 0,
  "data"     text                        default ''::text,
  constraint "netuno_log_pkey" primary key (id)
);

create table "public"."netuno_statistic_average_type" (
  "id"   integer                not null,
  "code" character varying(250) default ''::character varying,
  constraint "netuno_statistic_average_type_pkey" primary key (id)
);

create table "public"."netuno_statistic_average" (
  "id"              integer                     not null,
  "type_id"         integer                     default 0,
  "average_type_id" integer                     default 0,
  "moment"          timestamp without time zone default current_timestamp,
  "average"         integer                     default 0,
  constraint "netuno_statistic_average_pkey" primary key (id)
);

create table "public"."netuno_statistic_moment" (
  "id"      integer                     not null,
  "type_id" integer                     default 0,
  "moment"  timestamp without time zone default current_timestamp,
  "count"   integer                     default 0,
  constraint "netuno_statistic_moment_pkey" primary key (id)
);

create table "public"."netuno_statistic_type" (
  "id"   integer                not null,
  "code" character varying(250) default ''::character varying,
  constraint "netuno_statistic_type_pkey" primary key (id)
);

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

create table "public"."netuno_user_rule" (
  "id"          integer not null,
  "user_id"     integer default 0,
  "table_id"    integer default 0,
  "active"      boolean default true,
  "rule_read"   integer default 0,
  "rule_write"  integer default 0,
  "rule_delete" integer default 0,
  constraint "netuno_user_rule_pkey" primary key (id)
);

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

create table "public"."notifications" (
  "id"         integer                  not null default nextval('public.notifications_id_seq'::regclass),
  "user_id"    uuid                     not null,
  "type"       text                     not null,
  "message"    text                     not null,
  "link"       text,
  "is_read"    boolean                  default false,
  "created_at" timestamp with time zone default now(),
  constraint "notifications_pkey" primary key (id),
  constraint "notifications_type_check" check ((type = ANY (ARRAY['reply'::text, 'mention'::text, 'like'::text])))
);

alter table "public"."notifications"
  enable row level security;

create table "public"."plantacao_historico" (
  "id"               bigint                   generated always as identity not null,
  "plantacao_id"     bigint                   not null,
  "evento"           text                     not null,
  "valor_antigo"     text,
  "valor_novo"       text,
  "notas_utilizador" text,
  "criado_em"        timestamp with time zone default now(),
  constraint "plantacao_historico_pkey" primary key (id)
);

alter table "public"."plantacao_historico"
  enable row level security;

create table "public"."plantacoes" (
  "id"                          bigint                   generated always as identity not null,
  "utilizador_id"               uuid                     not null,
  "cultura_id"                  uuid                     not null,
  "localizacao_id"              bigint,
  "local_nome"                  text,
  "data_plantacao"              date                     not null,
  "data_colheita_prevista"      date,
  "data_colheita_real"          date,
  "estado"                      text                     not null default 'plantada'::text,
  "fenologia"                   text,
  "fase_lunar_plantacao"        text,
  "temperatura_media_plantacao" numeric,
  "humidade_media_plantacao"    numeric,
  "notas"                       text,
  "fotografias"                 jsonb                    default '[]'::jsonb,
  "origem"                      text                     default 'utilizador'::text,
  "criado_em"                   timestamp with time zone default now(),
  "atualizado_em"               timestamp with time zone default now(),
  constraint "plantacoes_pkey" primary key (id)
);

alter table "public"."plantacoes"
  enable row level security;

create table "public"."post_images" (
  "id"           bigint                   generated always as identity not null,
  "post_id"      integer                  not null,
  "storage_path" text                     not null,
  "sort_order"   integer                  not null default 0,
  "created_at"   timestamp with time zone not null default now(),
  constraint "post_images_pkey" primary key (id)
);

alter table "public"."post_images"
  enable row level security;

create table "public"."posts" (
  "id"            integer                  not null default nextval('public.posts_id_seq'::regclass),
  "thread_id"     integer                  not null,
  "author_id"     uuid                     not null,
  "content"       text                     not null,
  "is_first_post" boolean                  default false,
  "created_at"    timestamp with time zone default now(),
  "updated_at"    timestamp with time zone default now(),
  constraint "posts_pkey" primary key (id)
);

alter table "public"."posts"
  enable row level security;

create table "public"."profiles" (
  "id"                     uuid                     not null,
  "username"               text                     not null,
  "display_name"           text,
  "bio"                    text,
  "location"               text,
  "avatar_url"             text,
  "reputation"             integer                  default 0,
  "is_admin"               boolean                  default false,
  "created_at"             timestamp with time zone default now(),
  "updated_at"             timestamp with time zone default now(),
  "email"                  text,
  "two_factor_enabled"     boolean                  not null default false,
  "deleted_at"             timestamp with time zone,
  "mfa_setup_dismissed_at" timestamp with time zone,
  "is_stand_automovel"     boolean                  not null default false,
  constraint "profiles_pkey" primary key (id),
  constraint "profiles_username_key" unique (username)
);

alter table "public"."profiles"
  enable row level security;

create table "public"."recovery_codes" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "code_hash"  text                     not null,
  "used"       boolean                  not null default false,
  "created_at" timestamp with time zone not null default now(),
  constraint "recovery_codes_pkey" primary key (id)
);

alter table "public"."recovery_codes"
  enable row level security;

create table "public"."refeicoes_alojamento" (
  "id"            bigint                   generated always as identity not null,
  "alojamento_id" bigint                   not null,
  "tipo_refeicao" character varying        not null,
  "preco_extra"   numeric(8,2),
  "disponivel"    boolean                  not null default true,
  "created_at"    timestamp with time zone not null default now(),
  "updated_at"    timestamp with time zone not null default now(),
  constraint "refeicoes_alojamento_pkey" primary key (id),
  constraint "refeicoes_alojamento_tipo_refeicao_check"
    check (((tipo_refeicao)::text = ANY ((ARRAY['pequeno_almoco'::character varying, 'almoço'::character varying, 'jantar'::character varying])::text[]))),
  constraint "unique_alojamento_refeicao" unique (alojamento_id, tipo_refeicao)
);

alter table "public"."refeicoes_alojamento"
  enable row level security;

create table "public"."reservas_alojamento" (
  "id"               bigint                   generated always as identity not null,
  "alojamento_id"    bigint                   not null,
  "nome_hospede"     text                     not null,
  "email_hospede"    character varying        not null,
  "telefone_hospede" character varying,
  "data_entrada"     date                     not null,
  "data_saida"       date                     not null,
  "num_pessoas"      integer                  not null,
  "num_quartos"      integer                  not null,
  "tipo_refeicao"    character varying        not null,
  "preco_total"      numeric(10,2)            not null,
  "status"           character varying        not null default 'pendente'::character varying,
  "observacoes"      text,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  "user_id"          uuid,
  constraint "check_datas" check ((data_saida > data_entrada)),
  constraint "reservas_alojamento_num_pessoas_check" check ((num_pessoas > 0)),
  constraint "reservas_alojamento_num_quartos_check" check ((num_quartos > 0)),
  constraint "reservas_alojamento_pkey" primary key (id),
  constraint "reservas_alojamento_status_check"
    check
    (((status)::text = ANY ((ARRAY['pendente'::character varying, 'confirmada'::character varying, 'concluido'::character varying, 'cancelada'::character varying])::text[]))),
  constraint "reservas_alojamento_tipo_refeicao_check"
    check
    (((tipo_refeicao)::text = ANY (ARRAY[('sem_refeicoes'::character varying)::text, ('incluido'::character varying)::text, ('pequeno_almoco'::character varying)::text,
    ('meia_pensao'::character varying)::text, ('pensao_completa'::character varying)::text, ('almoço'::character varying)::text, ('jantar'::character varying)::text])))
);

alter table "public"."reservas_alojamento"
  enable row level security;

create table "public"."reserved_usernames" (
  "username" text collate pg_catalog."C" not null,
  constraint "reserved_usernames_pkey" primary key (username)
);

alter table "public"."reserved_usernames"
  enable row level security;

create table "public"."restaurante_reservas" (
  "id"             bigint                   generated by default as identity not null,
  "created_at"     timestamp with time zone not null default now(),
  "restaurante_id" bigint,
  "nome_cliente"   text,
  "email_cliente"  text,
  "telefone"       text,
  "data_reserva"   date,
  "hora_reserva"   time without time zone,
  "numero_pessoas" bigint,
  "observacoes"    text,
  "user_id"        uuid,
  constraint "restaurante_reservas_pkey" primary key (id)
);

alter table "public"."restaurante_reservas"
  enable row level security;

create table "public"."restaurantes" (
  "id"             bigint                   generated always as identity not null,
  "nome"           text                     not null,
  "descricao"      text,
  "especialidade"  text,
  "preco_medio"    numeric(10,2),
  "rating"         numeric(3,2),
  "telefone"       text,
  "email"          text,
  "website"        text,
  "localizacao_id" bigint                   not null,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  constraint "restaurantes_pkey" primary key (id),
  constraint "restaurantes_preco_medio_check" check (((preco_medio IS NULL) OR (preco_medio >= (0)::numeric))),
  constraint "restaurantes_rating_check" check (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric))))
);

alter table "public"."restaurantes"
  enable row level security;

create table "public"."threads" (
  "id"            integer                  not null default nextval('public.threads_id_seq'::regclass),
  "category_id"   integer                  not null,
  "author_id"     uuid                     not null,
  "title"         text                     not null,
  "slug"          text                     not null,
  "is_pinned"     boolean                  default false,
  "is_locked"     boolean                  default false,
  "views"         integer                  default 0,
  "replies_count" integer                  default 0,
  "last_post_at"  timestamp with time zone default now(),
  "created_at"    timestamp with time zone default now(),
  constraint "threads_category_id_slug_key" unique (category_id, slug),
  constraint "threads_pkey" primary key (id)
);

alter table "public"."threads"
  enable row level security;

create table "public"."tipos_alojamento" (
  "id"         bigint                   generated always as identity not null,
  "nome"       character varying        not null,
  "descricao"  text,
  "created_at" timestamp with time zone not null default now(),
  constraint "tipos_alojamento_nome_key" unique (nome),
  constraint "tipos_alojamento_pkey" primary key (id)
);

alter table "public"."tipos_alojamento"
  enable row level security;

create table "public"."user_sessions" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "device"     text,
  "browser"    text,
  "ip"         inet,
  "user_agent" text,
  "created_at" timestamp with time zone not null default now(),
  "last_seen"  timestamp with time zone not null default now(),
  "revoked"    boolean                  not null default false,
  constraint "user_sessions_pkey" primary key (id)
);

alter table "public"."user_sessions"
  enable row level security;

create table "public"."username_history" (
  "id"           integer                  not null default nextval('public.username_history_id_seq'::regclass),
  "user_id"      uuid,
  "old_username" text                     not null,
  "new_username" text,
  "changed_at"   timestamp with time zone default now(),
  constraint "username_history_pkey" primary key (id)
);

alter table "public"."username_history"
  enable row level security;

alter sequence "public"."categories_id_seq" owned by "public"."categories"."id";

alter sequence "public"."freguesia_audit_id_seq" owned by "public"."freguesia_audit"."id";

alter sequence "public"."freguesias_id_seq" owned by "public"."freguesias"."id";

alter sequence "public"."marketplace_ads_id_seq" owned by "public"."marketplace_ads"."id";

alter sequence "public"."marketplace_categories_id_seq" owned by "public"."marketplace_categories"."id";

alter sequence "public"."marketplace_conversations_id_seq" owned by "public"."marketplace_conversations"."id";

alter sequence "public"."marketplace_favorites_id_seq" owned by "public"."marketplace_favorites"."id";

alter sequence "public"."marketplace_message_attachments_id_seq" owned by "public"."marketplace_message_attachments"."id";

alter sequence "public"."marketplace_messages_id_seq" owned by "public"."marketplace_messages"."id";

alter sequence "public"."marketplace_photos_id_seq" owned by "public"."marketplace_photos"."id";

alter sequence "public"."municipios_id_seq" owned by "public"."municipios"."id";

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."posts_id_seq" owned by "public"."posts"."id";

alter sequence "public"."threads_id_seq" owned by "public"."threads"."id";

alter table "public"."threads"
  add column "search_vector" tsvector generated always as (to_tsvector('portuguese'::regconfig, title)) stored;

alter sequence "public"."username_history_id_seq" owned by "public"."username_history"."id";

create type "public"."user_role" as enum (
  'user',
  'moderator',
  'admin'
);

alter table "public"."profiles"
  add column "role" public.user_role not null default 'user'::public.user_role;

create or replace function public.check_username_availability (
  p_username text
)
  returns boolean
  language plpgsql
  AS $function$
BEGIN
    RETURN NOT (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE LOWER(p.username) = LOWER(p_username)
        )
        OR EXISTS (
            SELECT 1
            FROM public.reserved_usernames r
            WHERE LOWER(r.username) = LOWER(p_username)
        )
        OR EXISTS (
            SELECT 1
            FROM public.username_history h
            WHERE LOWER(h.old_username) = LOWER(p_username)
        )
    );
END;
$function$;

create or replace function public.generate_username (
  base_name text
)
  returns text
  language plpgsql
  AS $function$
DECLARE
    base_username TEXT;
    final_username TEXT;
    suffix INTEGER := 2;
BEGIN

    base_username := LOWER(
        REGEXP_REPLACE(
            UNACCENT(
                COALESCE(NULLIF(TRIM(base_name), ''), 'user')
            ),
            '[^a-z0-9_]',
            '',
            'g'
        )
    );

    IF LENGTH(base_username) < 2 THEN
        base_username := 'user';
    END IF;

    final_username := base_username;

    LOOP

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE LOWER(p.username)=LOWER(final_username)
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.reserved_usernames r
            WHERE LOWER(r.username)=LOWER(final_username)
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.username_history h
            WHERE LOWER(h.old_username)=LOWER(final_username)
        );

        final_username := base_username || suffix;
        suffix := suffix + 1;

        IF suffix > 1000 THEN
            final_username :=
                'u_' ||
                substring(
                    replace(gen_random_uuid()::text,'-','')
                    from 1 for 20
                );

            EXIT;
        END IF;

    END LOOP;

    RETURN final_username;

END;
$function$;

create or replace function public.geo_distance (
  lat1  double precision,
  lon1  double precision,
  lat2  double precision,
  lon2  double precision,
  units character varying
)
  returns double precision
  language plpgsql
  AS $function$                                                                                                         
    DECLARE                                                                                                                     
        dist float = 0;                                                                                                         
        radlat1 float;                                                                                                          
        radlat2 float;                                                                                                          
        theta float;                                                                                                            
        radtheta float;                                                                                                         
    BEGIN                                                                                                                       
        IF lat1 = lat2 OR lon1 = lon2                                                                                           
            THEN RETURN dist;                                                                                                   
        ELSE                                                                                                                    
            radlat1 = pi() * lat1 / 180;                                                                                        
            radlat2 = pi() * lat2 / 180;                                                                                        
            theta = lon1 - lon2;                                                                                                
            radtheta = pi() * theta / 180;                                                                                      
            dist = sin(radlat1) * sin(radlat2) + cos(radlat1) * cos(radlat2) * cos(radtheta);                                   
                                                                                                                                
            IF dist > 1 THEN dist = 1; END IF;                                                                                  
                                                                                                                                
            dist = acos(dist);                                                                                                  
            dist = dist * 180 / pi();                                                                                           
            dist = dist * 60 * 1.1515;                                                                                          
                                                                                                                                
            IF units = 'K' THEN dist = dist * 1.609344; END IF;                                                                 
            IF units = 'N' THEN dist = dist * 0.8684; END IF;                                                                   
                                                                                                                                
            RETURN dist;                                                                                                        
        END IF;                                                                                                                 
    END;                                                                                                                        
$function$;

create or replace function public.gran_bazar_advance_auctions()
  returns void
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
begin
  -- scheduled → live
  update public.marketplace_auctions
    set status = 'live'
    where status = 'scheduled'
      and starts_at <= now();

  -- live → ended, com vencedor: maior "amount"; empate desempatado pelo
  -- lance mais antigo (created_at asc) — na prática não deve haver
  -- empates de valor porque cada lance tem de exceder estritamente o
  -- current_price anterior, mas mantém-se o desempate por segurança.
  update public.marketplace_auctions a
    set status = 'ended',
        winner_id = w.bidder_id
    from (
      select distinct on (b.auction_id) b.auction_id, b.bidder_id
      from public.marketplace_auction_bids b
      order by b.auction_id, b.amount desc, b.created_at asc
    ) w
    where a.id = w.auction_id
      and a.status = 'live'
      and a.ends_at <= now();

  -- live → ended, sem nenhum lance
  update public.marketplace_auctions
    set status = 'ended'
    where status = 'live'
      and ends_at <= now()
      and winner_id is null;

  -- reflete o resultado no anúncio: vendido (tem vencedor) ou expirado
  -- (ninguém licitou)
  update public.marketplace_ads ad
    set status = 'sold'
    from public.marketplace_auctions a
    where a.ad_id = ad.id
      and a.status = 'ended'
      and a.winner_id is not null
      and ad.status = 'active';

  update public.marketplace_ads ad
    set status = 'expired'
    from public.marketplace_auctions a
    where a.ad_id = ad.id
      and a.status = 'ended'
      and a.winner_id is null
      and ad.status = 'active';
end;
$function$;

create or replace function public.gran_bazar_create_auction_if_needed()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
declare
  v_start_price     numeric(10,2);
  v_min_increment   numeric(10,2);
  v_starts_at       timestamptz;
  v_ends_at         timestamptz;
begin
  if new.module <> ALL (ARRAY['gran-bazar'::text, 'imoveis'::text]) or new.type <> 'leilao' then
    return new;
  end if;

  -- já existe leilão para este anúncio (ex: update repetido) — não duplicar
  if exists (select 1 from public.marketplace_auctions where ad_id = new.id) then
    return new;
  end if;

  if new.details is null or new.details->>'start_price' is null then
    raise exception 'Leilão sem preço inicial (details.start_price em falta)';
  end if;
  if new.details->>'ends_at' is null then
    raise exception 'Leilão sem data de encerramento (details.ends_at em falta)';
  end if;

  v_start_price   := (new.details->>'start_price')::numeric;
  v_min_increment := coalesce((new.details->>'minimum_increment')::numeric, 1.00);
  v_starts_at     := coalesce((new.details->>'starts_at')::timestamptz, now());
  v_ends_at       := (new.details->>'ends_at')::timestamptz;

  if v_ends_at <= v_starts_at then
    raise exception 'A data de encerramento do leilão tem de ser depois da data de início';
  end if;

  insert into public.marketplace_auctions (
    ad_id, start_price, current_price, minimum_increment, starts_at, ends_at, status
  ) values (
    new.id, v_start_price, v_start_price, v_min_increment, v_starts_at, v_ends_at,
    case when v_starts_at <= now() then 'live' else 'scheduled' end
  );

  return new;
end;
$function$;

create or replace function public.gran_bazar_place_bid (
  p_auction_id bigint,
  p_amount     numeric,
  p_request_id text    default null::text
)
  returns public.marketplace_auction_bids
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
declare
  v_auction   public.marketplace_auctions%rowtype;
  v_ad        public.marketplace_ads%rowtype;
  v_bidder    uuid := auth.uid();
  v_min_valid numeric(10,2);
  v_bid       public.marketplace_auction_bids%rowtype;
begin
  if v_bidder is null then
    raise exception 'É necessário iniciar sessão para licitar' using errcode = '28000';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Lance inválido';
  end if;

  select * into v_auction
    from public.marketplace_auctions
    where id = p_auction_id
    for update;

  if not found then
    raise exception 'Leilão não encontrado';
  end if;

  select * into v_ad
    from public.marketplace_ads
    where id = v_auction.ad_id;

  if v_ad.author_id = v_bidder then
    raise exception 'Não podes licitar no teu próprio leilão';
  end if;

  -- auto-corrige o estado se o job de avanço (secção 5) ainda não correu
  -- mas o leilão já devia estar a decorrer
  if v_auction.status = 'scheduled' and v_auction.starts_at <= now() then
    update public.marketplace_auctions set status = 'live' where id = v_auction.id;
    v_auction.status := 'live';
  end if;

  if v_auction.status <> 'live' then
    raise exception 'Este leilão não está a decorrer (estado: %)', v_auction.status;
  end if;

  if now() >= v_auction.ends_at then
    raise exception 'Este leilão já terminou';
  end if;

  v_min_valid := v_auction.current_price + v_auction.minimum_increment;
  if p_amount < v_min_valid then
    raise exception 'O lance mínimo é % €', v_min_valid;
  end if;

  begin
    insert into public.marketplace_auction_bids (auction_id, bidder_id, amount, request_id)
    values (p_auction_id, v_bidder, p_amount, p_request_id)
    returning * into v_bid;
  exception
    when unique_violation then
      -- mesmo request_id já processado: devolve o lance já existente em
      -- vez de repetir ou falhar (retry idempotente do cliente)
      select * into v_bid
        from public.marketplace_auction_bids
        where auction_id = p_auction_id
          and bidder_id = v_bidder
          and request_id = p_request_id;
      return v_bid;
  end;

  update public.marketplace_auctions
    set current_price = p_amount
    where id = p_auction_id;

  return v_bid;
end;
$function$;

create or replace function public.handle_new_post()
  returns trigger
  language plpgsql
  AS $function$
begin
    update threads
    set replies_count = replies_count + 1,
        last_post_at = now()
    where id = new.thread_id;
    return new;
end;
$function$;

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
DECLARE
    v_generated_username TEXT;
    v_display_name_input TEXT;
BEGIN
    v_display_name_input := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1)
    );

    v_generated_username := public.generate_username(v_display_name_input);

    INSERT INTO public.profiles (
        id, display_name, username, email, created_at, updated_at
    )
    VALUES (
        NEW.id, v_display_name_input, v_generated_username, NEW.email, NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$function$;

create or replace function public.handle_updated_at()
  returns trigger
  language plpgsql
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

create or replace function public.notify_thread_author()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
declare
    thread_author uuid;
    thread_title text;
begin
    select author_id, title into thread_author, thread_title
    from threads where id = new.thread_id;

    if thread_author != new.author_id then
        insert into notifications (user_id, type, message, link)
        values (
            thread_author,
            'reply',
            'Nova resposta no topico "' || thread_title || '"',
            '/forum/topico/' || new.thread_id
        );
    end if;

    return new;
end;
$function$;

create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

create or replace function public.uuid_generate_v4()
  returns uuid
  language sql
  AS $function$SELECT extensions.uuid_generate_v4();$function$;

create or replace function public.validar_entidade_pedido_participar()
  returns trigger
  language plpgsql
  AS $function$
declare
  v_municipio_nome text;
  v_freguesia_municipio text;
begin
  if new.tipo_entidade not in ('municipio', 'freguesia') then
    return new;
  end if;

  -- Normalização do email institucional (trim + lowercase) — espelha a
  -- normalização já feita no cliente, mas não confia só nela.
  if new.contacto_email is not null then
    new.contacto_email := lower(btrim(new.contacto_email));
  end if;

  if new.nome_entidade is null or btrim(new.nome_entidade) = '' then
    raise exception 'nome_entidade é obrigatório.' using errcode = '23514';
  end if;

  if new.presidente_nome is null or btrim(new.presidente_nome) = '' then
    raise exception 'presidente_nome é obrigatório.' using errcode = '23514';
  end if;

  if new.responsavel_nome is null or btrim(new.responsavel_nome) = '' then
    raise exception 'responsavel_nome é obrigatório.' using errcode = '23514';
  end if;

  if new.contacto_email is null
     or new.contacto_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'email_institucional em formato inválido.' using errcode = '23514';
  end if;

  if new.tipo_entidade = 'municipio' then
    if new.municipio_id is null then
      raise exception 'municipio_id é obrigatório para tipo_entidade = municipio.' using errcode = '23514';
    end if;
    if new.freguesia_id is not null then
      raise exception 'Um pedido de Município não deve indicar freguesia_id.' using errcode = '23514';
    end if;

  elsif new.tipo_entidade = 'freguesia' then
    if new.freguesia_id is null then
      raise exception 'freguesia_id é obrigatório para tipo_entidade = freguesia.' using errcode = '23514';
    end if;
    if new.municipio_id is null then
      raise exception 'municipio_id é obrigatório para tipo_entidade = freguesia (necessário para validar a relação com a freguesia).' using errcode = '23514';
    end if;

    select nome into v_municipio_nome
      from public.municipios where id = new.municipio_id;
    select municipio into v_freguesia_municipio
      from public.freguesias where id = new.freguesia_id;

    if v_municipio_nome is null then
      raise exception 'Município seleccionado não existe.' using errcode = '23503';
    end if;
    if v_freguesia_municipio is null then
      raise exception 'Freguesia seleccionada não existe.' using errcode = '23503';
    end if;

    if lower(public.unaccent(v_freguesia_municipio)) <> lower(public.unaccent(v_municipio_nome)) then
      raise exception 'A freguesia seleccionada não pertence ao município seleccionado.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

alter table "public"."calendar_event_favorites"
  add constraint "calendar_event_favorites_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."calendar_event_participants"
  add constraint "calendar_event_participants_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."calendar_events"
  add constraint "calendar_events_category_id_fkey" foreign key (category_id) references public.calendar_categories(id) on delete set null;

alter table "public"."calendar_events"
  add constraint "calendar_events_created_by_fkey" foreign key (created_by) references auth.users(id) on delete cascade;

alter table "public"."calendar_event_favorites"
  add constraint "calendar_event_favorites_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade;

alter table "public"."calendar_event_images"
  add constraint "calendar_event_images_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade;

alter table "public"."calendar_event_participants"
  add constraint "calendar_event_participants_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade;

alter table "public"."calendar_reminders"
  add constraint "calendar_reminders_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade;

alter table "public"."calendar_reminders"
  add constraint "calendar_reminders_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."calendar_user_calendar"
  add constraint "calendar_user_calendar_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade;

alter table "public"."calendar_user_calendar"
  add constraint "calendar_user_calendar_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."categories"
  add constraint "categories_parent_id_fkey" foreign key (parent_id) references public.categories(id);

alter table "public"."culturas_aptidoes"
  add constraint "culturas_aptidoes_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete cascade;

alter table "public"."culturas_produtos"
  add constraint "culturas_produtos_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete cascade;

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_categoria_id_fkey" foreign key (categoria_id) references public.categorias_entidade(id);

alter table "public"."entidades"
  add constraint "entidades_categoria_id_fkey" foreign key (categoria_id) references public.categorias_entidade(id);

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete set null;

alter table "public"."entidade_relacoes"
  add constraint "entidade_relacoes_entidade_destino_id_fkey" foreign key (entidade_destino_id) references public.entidades(id) on delete cascade;

alter table "public"."entidade_relacoes"
  add constraint "entidade_relacoes_entidade_origem_id_fkey" foreign key (entidade_origem_id) references public.entidades(id) on delete cascade;

alter table "public"."eventos"
  add constraint "eventos_entidade_organizadora_id_fkey" foreign key (entidade_organizadora_id) references public.entidades(id);

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id) on delete set null;

alter table "public"."entidades"
  add constraint "entidades_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id);

alter table "public"."eventos"
  add constraint "eventos_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id);

alter table "public"."freguesia_audit"
  add constraint "freguesia_audit_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id) on delete cascade;

alter table "public"."horarios"
  add constraint "horarios_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete cascade;

alter table "public"."horarios_excecoes"
  add constraint "horarios_excecoes_entidade_id_fkey" foreign key (entidade_id) references public.entidades(id) on delete cascade;

alter table "public"."alojamentos"
  add constraint "alojamentos_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id) on delete restrict;

alter table "public"."entidades"
  add constraint "entidades_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id);

alter table "public"."eventos"
  add constraint "eventos_localizacao_id_fkey" foreign key (localizacao_id) references public.localizacoes(id);

alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_category_id_fkey" foreign key (category_id) references public.categories(id);

alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id);

alter table "public"."marketplace_auctions"
  add constraint "marketplace_auctions_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade;

alter table "public"."marketplace_auction_bids"
  add constraint "marketplace_auction_bids_auction_id_fkey" foreign key (auction_id) references public.marketplace_auctions(id) on delete cascade;

alter table "public"."marketplace_conversations"
  add constraint "marketplace_conversations_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade;

alter table "public"."marketplace_conversations"
  add constraint "marketplace_conversations_buyer_id_fkey" foreign key (buyer_id) references auth.users(id) on delete cascade;

alter table "public"."marketplace_conversations"
  add constraint "marketplace_conversations_seller_id_fkey" foreign key (seller_id) references auth.users(id) on delete cascade;

alter table "public"."marketplace_favorites"
  add constraint "marketplace_favorites_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade;

alter table "public"."marketplace_favorites"
  add constraint "marketplace_favorites_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."marketplace_messages"
  add constraint "marketplace_messages_conversation_id_fkey" foreign key (conversation_id) references public.marketplace_conversations(id) on delete cascade;

alter table "public"."marketplace_message_attachments"
  add constraint "marketplace_message_attachments_message_id_fkey" foreign key (message_id) references public.marketplace_messages(id) on delete cascade;

alter table "public"."marketplace_messages"
  add constraint "marketplace_messages_sender_id_fkey" foreign key (sender_id) references auth.users(id) on delete cascade;

alter table "public"."marketplace_photos"
  add constraint "marketplace_photos_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade;

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_municipio_id_fkey" foreign key (municipio_id) references public.municipios(id) on delete set null;

alter table "public"."plantacoes"
  add constraint "plantacoes_cultura_id_fkey" foreign key (cultura_id) references public.culturas_guia(id) on delete restrict;

alter table "public"."plantacao_historico"
  add constraint "plantacao_historico_plantacao_id_fkey" foreign key (plantacao_id) references public.plantacoes(id) on delete cascade;

alter table "public"."plantacoes"
  add constraint "plantacoes_utilizador_id_fkey" foreign key (utilizador_id) references auth.users(id) on delete cascade;

alter table "public"."post_images"
  add constraint "post_images_post_id_fkey" foreign key (post_id) references public.posts(id) on delete cascade;

alter table "public"."profiles"
  add constraint "profiles_id_fkey" foreign key (id) references auth.users(id) on delete cascade;

alter table "public"."audit_log"
  add constraint "audit_log_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete set null;

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_profile_id_fkey" foreign key (profile_id) references public.profiles(id) on delete cascade;

alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_resolvido_por_fkey" foreign key (resolvido_por) references public.profiles(id);

alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_author_id_fkey" foreign key (author_id) references public.profiles(id);

alter table "public"."marketplace_auction_bids"
  add constraint "marketplace_auction_bids_bidder_id_fkey" foreign key (bidder_id) references public.profiles(id);

alter table "public"."marketplace_auctions"
  add constraint "marketplace_auctions_winner_id_fkey" foreign key (winner_id) references public.profiles(id);

alter table "public"."notifications"
  add constraint "notifications_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade;

alter table "public"."posts"
  add constraint "posts_author_id_fkey" foreign key (author_id) references public.profiles(id);

alter table "public"."recovery_codes"
  add constraint "recovery_codes_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade;

alter table "public"."refeicoes_alojamento"
  add constraint "refeicoes_alojamento_alojamento_id_fkey" foreign key (alojamento_id) references public.alojamentos(id) on delete cascade;

alter table "public"."reservas_alojamento"
  add constraint "reservas_alojamento_alojamento_id_fkey" foreign key (alojamento_id) references public.alojamentos(id) on delete restrict;

alter table "public"."reservas_alojamento"
  add constraint "reservas_alojamento_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."restaurante_reservas"
  add constraint "fk_restaurante_reservas_user_id" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."restaurantes"
  add constraint "restaurantes_localizacao_fk" foreign key (localizacao_id) references public.localizacoes(id) on delete restrict;

alter table "public"."restaurante_reservas"
  add constraint "restaurante_reservas_restaurante_id_fkey" foreign key (restaurante_id) references public.restaurantes(id) on delete restrict;

alter table "public"."threads"
  add constraint "threads_author_id_fkey" foreign key (author_id) references public.profiles(id);

alter table "public"."threads"
  add constraint "threads_category_id_fkey" foreign key (category_id) references public.categories(id);

alter table "public"."posts"
  add constraint "posts_thread_id_fkey" foreign key (thread_id) references public.threads(id) on delete cascade;

alter table "public"."alojamentos"
  add constraint "alojamentos_tipo_fkey" foreign key (tipo) references public.tipos_alojamento(nome);

alter table "public"."user_sessions"
  add constraint "user_sessions_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade;

alter table "public"."username_history"
  add constraint "username_history_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

create view "public"."calendar_events_public" with (security_invoker=true) AS  SELECT e.id,
    e.title,
    e.slug,
    e.description,
    e.starts_at,
    e.ends_at,
    e.all_day,
    e.location_name,
    e.municipality,
    e.district,
    e.is_featured,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon
   FROM (public.calendar_events e
     LEFT JOIN public.calendar_categories c ON ((c.id = e.category_id)))
  WHERE ((e.visibility = 'public'::text) AND (e.status = 'published'::text));

create index arteria_codigo_group_id_idx on public.arteria_codigo using btree (group_id);

create index arteria_codigo_id_idx on public.arteria using btree (codigo_id);

create index arteria_codigo_lastchange_user_id_idx on public.arteria_codigo using btree (lastchange_user_id);

create index arteria_codigo_user_id_idx on public.arteria_codigo using btree (user_id);

create index arteria_group_id_idx on public.arteria using btree (group_id);

create index arteria_lastchange_user_id_idx on public.arteria using btree (lastchange_user_id);

create index arteria_local_group_id_idx on public.arteria_local using btree (group_id);

create index arteria_local_id_idx on public.arteria using btree (local_id);

create index arteria_local_lastchange_user_id_idx on public.arteria_local using btree (lastchange_user_id);

create index arteria_local_user_id_idx on public.arteria_local using btree (user_id);

create index arteria_nome_group_id_idx on public.arteria_nome using btree (group_id);

create index arteria_nome_id_idx on public.arteria using btree (nome_id);

create index arteria_nome_lastchange_user_id_idx on public.arteria_nome using btree (lastchange_user_id);

create index arteria_nome_user_id_idx on public.arteria_nome using btree (user_id);

create index arteria_tipo_group_id_idx on public.arteria_tipo using btree (group_id);

create index arteria_tipo_id_idx on public.arteria using btree (tipo_id);

create index arteria_tipo_lastchange_user_id_idx on public.arteria_tipo using btree (lastchange_user_id);

create index arteria_tipo_user_id_idx on public.arteria_tipo using btree (user_id);

create index arteria_titulo_group_id_idx on public.arteria_titulo using btree (group_id);

create index arteria_titulo_id_idx on public.arteria using btree (titulo_id);

create index arteria_titulo_lastchange_user_id_idx on public.arteria_titulo using btree (lastchange_user_id);

create index arteria_titulo_user_id_idx on public.arteria_titulo using btree (user_id);

create index arteria_user_id_idx on public.arteria using btree (user_id);

create index audit_log_action_idx on public.audit_log using btree (action);

create index audit_log_created_at_idx on public.audit_log using btree (created_at);

create index audit_log_user_id_idx on public.audit_log using btree (user_id);

create index codigo_postal_arteria_arteria_id_idx on public.codigo_postal_arteria using btree (arteria_id);

create index codigo_postal_arteria_codigo_postal_id_idx on public.codigo_postal_arteria using btree (codigo_postal_id);

create index codigo_postal_arteria_group_id_idx on public.codigo_postal_arteria using btree (group_id);

create index codigo_postal_arteria_id_idx on public.codigo_postal using btree (arteria_id);

create index codigo_postal_arteria_lastchange_user_id_idx on public.codigo_postal_arteria using btree (lastchange_user_id);

create index codigo_postal_arteria_user_id_idx on public.codigo_postal_arteria using btree (user_id);

create index codigo_postal_group_id_idx on public.codigo_postal using btree (group_id);

create index codigo_postal_lastchange_user_id_idx on public.codigo_postal using btree (lastchange_user_id);

create index codigo_postal_localidade_id_idx on public.codigo_postal using btree (localidade_id);

create index codigo_postal_user_id_idx on public.codigo_postal using btree (user_id);

create index concelho_distrito_id_idx on public.concelho using btree (distrito_id);

create index concelho_group_id_idx on public.concelho using btree (group_id);

create index concelho_lastchange_user_id_idx on public.concelho using btree (lastchange_user_id);

create index concelho_user_id_idx on public.concelho using btree (user_id);

create index designacao_postal_group_id_idx on public.designacao_postal using btree (group_id);

create index designacao_postal_lastchange_user_id_idx on public.designacao_postal using btree (lastchange_user_id);

create index designacao_postal_user_id_idx on public.designacao_postal using btree (user_id);

create index distrito_group_id_idx on public.distrito using btree (group_id);

create index distrito_lastchange_user_id_idx on public.distrito using btree (lastchange_user_id);

create index distrito_user_id_idx on public.distrito using btree (user_id);

create index idx_alojamentos_localizacao_id on public.alojamentos using btree (localizacao_id);

create index idx_alojamentos_nome on public.alojamentos using btree (nome);

create index idx_alojamentos_preco_noite on public.alojamentos using btree (preco_noite);

create index idx_alojamentos_tipo on public.alojamentos using btree (tipo);

create index idx_calendar_events_category on public.calendar_events using btree (category_id);

create index idx_calendar_events_creator on public.calendar_events using btree (created_by);

create index idx_calendar_events_end on public.calendar_events using btree (ends_at);

create index idx_calendar_events_start on public.calendar_events using btree (starts_at);

create index idx_calendar_events_status on public.calendar_events using btree (status);

create index idx_calendar_events_visibility on public.calendar_events using btree (visibility);

create index idx_calendar_favorites_user on public.calendar_event_favorites using btree (user_id);

create index idx_calendar_participants_event on public.calendar_event_participants using btree (event_id);

create index idx_calendar_participants_user on public.calendar_event_participants using btree (user_id);

create index idx_calendar_reminders_time on public.calendar_reminders using btree (remind_at);

create index idx_categorias_slug on public.categorias_entidade using btree (slug);

create index idx_conversations_ad on public.marketplace_conversations using btree (ad_id);

create index idx_conversations_buyer on public.marketplace_conversations using btree (buyer_id);

create unique index idx_conversations_par_direto on public.marketplace_conversations using btree (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id))
  where (ad_id is null);

create index idx_conversations_seller on public.marketplace_conversations using btree (seller_id);

create index idx_culturas_aptidoes_aptidao on public.culturas_aptidoes using btree (aptidao);

create index idx_culturas_aptidoes_cultura_id on public.culturas_aptidoes using btree (cultura_id);

create index idx_culturas_produtos_cultura_id on public.culturas_produtos using btree (cultura_id);

create index idx_culturas_produtos_nome on public.culturas_produtos using btree (produto_nome);

create index idx_entidade_pedidos_estado on public.entidade_pedidos using btree (estado);

create unique index idx_entidade_pedidos_freguesia_pendente on public.entidade_pedidos using btree (freguesia_id)
  where ((tipo_entidade = 'freguesia'::text) AND (estado = 'pendente'::text));

create index idx_entidade_pedidos_freguesia on public.entidade_pedidos using btree (freguesia_id);

create unique index idx_entidade_pedidos_municipio_pendente on public.entidade_pedidos using btree (municipio_id)
  where ((tipo_entidade = 'municipio'::text) AND (estado = 'pendente'::text));

create index idx_entidade_pedidos_municipio on public.entidade_pedidos using btree (municipio_id);

create index idx_entidade_pedidos_profile on public.entidade_pedidos using btree (profile_id);

create index idx_entidade_pedidos_tipo on public.entidade_pedidos using btree (tipo_entidade);

create index idx_entidades_categoria on public.entidades using btree (categoria_id);

create index idx_entidades_estado on public.entidades using btree (estado);

create index idx_entidades_freguesia on public.entidades using btree (freguesia_id);

create index idx_entidades_localizacao on public.entidades using btree (localizacao_id);

create index idx_entidades_ref on public.entidades using btree (ref_tabela, ref_id);

create index idx_entidades_slug on public.entidades using btree (slug);

create index idx_eventos_freguesia on public.eventos using btree (freguesia_id);

create index idx_eventos_inicio on public.eventos using btree (inicio);

create index idx_eventos_organizador on public.eventos using btree (entidade_organizadora_id);

create index idx_excecoes_entidade on public.horarios_excecoes using btree (entidade_id);

create index idx_favorites_ad on public.marketplace_favorites using btree (ad_id);

create index idx_favorites_user on public.marketplace_favorites using btree (user_id);

create index idx_freguesias_cod_ine on public.freguesias using btree (cod_ine);

create index idx_freguesias_email on public.freguesias using btree (email);

create index idx_freguesias_municipio on public.freguesias using btree (municipio);

create index idx_freguesias_nome on public.freguesias using btree (nome);

create index idx_horarios_entidade on public.horarios using btree (entidade_id);

create index idx_localizacoes_codigo_postal on public.localizacoes using btree (codigo_postal);

create index idx_localizacoes_geo on public.localizacoes using btree (latitude, longitude);

create index idx_localizacoes_localidade on public.localizacoes using btree (localidade);

create index idx_localizacoes_municipio on public.localizacoes using btree (municipio);

create index idx_localizacoes_nome on public.localizacoes using btree (nome);

create index idx_marketplace_ads_author on public.marketplace_ads using btree (author_id);

create index idx_marketplace_ads_module on public.marketplace_ads using btree (module, status, created_at desc);

create index idx_marketplace_ads_status on public.marketplace_ads using btree (status, created_at desc);

create index idx_marketplace_auction_bids_auction on public.marketplace_auction_bids using btree (auction_id, created_at desc);

create unique index idx_marketplace_auction_bids_request_id on public.marketplace_auction_bids using btree (auction_id, bidder_id, request_id)
  where (request_id is not null);

create index idx_marketplace_auctions_status_ends on public.marketplace_auctions using btree (status, ends_at);

create index idx_marketplace_photos_ad on public.marketplace_photos using btree (ad_id);

create index idx_messages_conversation on public.marketplace_messages using btree (conversation_id);

create index idx_messages_sender on public.marketplace_messages using btree (sender_id);

create index idx_msg_attachments_message on public.marketplace_message_attachments using btree (message_id);

create index idx_notifications_user on public.notifications using btree (user_id, is_read, created_at desc);

create index idx_post_images_post on public.post_images using btree (post_id);

create index idx_posts_thread on public.posts using btree (thread_id, created_at);

create index idx_profiles_stand_automovel on public.profiles using btree (is_stand_automovel)
  where (is_stand_automovel = true);

create index idx_profiles_username on public.profiles using btree (username);

create index idx_refeicoes_alojamento_id on public.refeicoes_alojamento using btree (alojamento_id);

create index idx_refeicoes_tipo on public.refeicoes_alojamento using btree (tipo_refeicao);

create index idx_relacoes_destino on public.entidade_relacoes using btree (entidade_destino_id);

create index idx_relacoes_origem on public.entidade_relacoes using btree (entidade_origem_id);

create index idx_reservas_alojamento_id on public.reservas_alojamento using btree (alojamento_id);

create index idx_reservas_alojamento_user_id on public.reservas_alojamento using btree (user_id);

create index idx_reservas_data_entrada on public.reservas_alojamento using btree (data_entrada);

create index idx_reservas_email on public.reservas_alojamento using btree (email_hospede);

create index idx_reservas_status on public.reservas_alojamento using btree (status);

create index idx_restaurante_reservas_email on public.restaurante_reservas using btree (email_cliente);

create index idx_restaurante_reservas_user_id on public.restaurante_reservas using btree (user_id);

create index idx_restaurantes_localizacao_id on public.restaurantes using btree (localizacao_id);

create index idx_restaurantes_nome on public.restaurantes using btree (nome);

create index idx_threads_category on public.threads using btree (category_id, is_pinned desc, last_post_at desc);

create index idx_threads_search on public.threads using gin (search_vector);

create index localidade_concelho_id_idx on public.localidade using btree (concelho_id);

create index localidade_group_id_idx on public.localidade using btree (group_id);

create index localidade_lastchange_user_id_idx on public.localidade using btree (lastchange_user_id);

create index localidade_user_id_idx on public.localidade using btree (user_id);

create index netuno_app_table_app_id_idx on public.netuno_app_table using btree (app_id);

create index netuno_app_table_table_id_idx on public.netuno_app_table using btree (table_id);

create index netuno_client_hit_client_id_idx on public.netuno_client_hit using btree (client_id);

create index netuno_client_hit_user_id_idx on public.netuno_client_hit using btree (user_id);

create index netuno_design_table_id_idx on public.netuno_design using btree (table_id);

create index netuno_group_rule_group_id_idx on public.netuno_group_rule using btree (group_id);

create index netuno_group_rule_table_id_idx on public.netuno_group_rule using btree (table_id);

create index netuno_log_group_id_idx on public.netuno_log using btree (group_id);

create index netuno_log_item_id_idx on public.netuno_log using btree (item_id);

create index netuno_log_table_id_idx on public.netuno_log using btree (table_id);

create index netuno_log_user_id_idx on public.netuno_log using btree (user_id);

create index netuno_statistic_average_type_id_idx on public.netuno_statistic_average using btree (type_id);

create index netuno_statistic_moment_type_id_idx on public.netuno_statistic_moment using btree (type_id);

create index netuno_table_group_id_idx on public.netuno_table using btree (group_id);

create index netuno_table_parent_id_idx on public.netuno_table using btree (parent_id);

create index netuno_user_group_id_idx on public.netuno_user using btree (group_id);

create index netuno_user_rule_table_id_idx on public.netuno_user_rule using btree (table_id);

create index netuno_user_rule_user_id_idx on public.netuno_user_rule using btree (user_id);

create index recovery_codes_used_idx on public.recovery_codes using btree (user_id)
  where (used = false);

create index recovery_codes_user_id_idx on public.recovery_codes using btree (user_id);

create index user_sessions_last_seen_idx on public.user_sessions using btree (last_seen);

create index user_sessions_revoked_idx on public.user_sessions using btree (revoked)
  where (revoked = false);

create index user_sessions_user_id_idx on public.user_sessions using btree (user_id);

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create trigger trg_calendar_categories_updated_at
  before update on public.calendar_categories
  for each row
  execute function public.set_updated_at();

create trigger trg_calendar_events_updated_at
  before update on public.calendar_events
  for each row
  execute function public.set_updated_at();

create trigger entidade_pedidos_updated_at
  before update on public.entidade_pedidos
  for each row
  execute function public.handle_updated_at();

create trigger entidade_pedidos_validar_participar
  before insert on public.entidade_pedidos
  for each row
  execute function public.validar_entidade_pedido_participar();

create trigger gran_bazar_create_auction_if_needed
  after insert or update of type, module on public.marketplace_ads
  for each row
  execute function public.gran_bazar_create_auction_if_needed();

create trigger marketplace_ads_updated_at
  before update on public.marketplace_ads
  for each row
  execute function public.handle_updated_at();

create trigger marketplace_auctions_updated_at
  before update on public.marketplace_auctions
  for each row
  execute function public.handle_updated_at();

create trigger on_post_created
  after insert on public.posts
  for each row
  execute function public.handle_new_post();

create trigger on_post_notify
  after insert on public.posts
  for each row
  execute function public.notify_thread_author();

create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create policy "Alojamentos - SELECT públicos" on "public"."alojamentos"
  for select
  to PUBLIC
  using (true);

create policy "audit_log_insert_auth" on "public"."audit_log"
  for insert
  to "service_role"
  with check (true);

create policy "audit_log_select_own" on "public"."audit_log"
  for select
  to PUBLIC
  using (((auth.uid() = user_id) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

create policy "calendar_categories_select" on "public"."calendar_categories"
  for select
  to PUBLIC
  using (true);

create policy "calendar_favorites_delete" on "public"."calendar_event_favorites"
  for delete
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_favorites_insert" on "public"."calendar_event_favorites"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "calendar_favorites_select" on "public"."calendar_event_favorites"
  for select
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_event_images_delete" on "public"."calendar_event_images"
  for delete
  to "authenticated"
  using ((exists ( select 1
   from public.calendar_events e
  where ((e.id = calendar_event_images.event_id) AND (e.created_by = auth.uid())))));

create policy "calendar_event_images_insert" on "public"."calendar_event_images"
  for insert
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM public.calendar_events e
  WHERE ((e.id = calendar_event_images.event_id) AND (e.created_by = auth.uid())))));

create policy "calendar_event_images_select" on "public"."calendar_event_images"
  for select
  to PUBLIC
  using (true);

create policy "calendar_event_images_update" on "public"."calendar_event_images"
  for update
  to "authenticated"
  using ((exists ( select 1
   from public.calendar_events e
  where ((e.id = calendar_event_images.event_id) AND (e.created_by = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM public.calendar_events e
  WHERE ((e.id = calendar_event_images.event_id) AND (e.created_by = auth.uid())))));

create policy "calendar_participants_delete" on "public"."calendar_event_participants"
  for delete
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_participants_insert" on "public"."calendar_event_participants"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "calendar_participants_select" on "public"."calendar_event_participants"
  for select
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_events_delete" on "public"."calendar_events"
  for delete
  to "authenticated"
  using ((auth.uid() = created_by));

create policy "calendar_events_insert" on "public"."calendar_events"
  for insert
  to "authenticated"
  with check ((auth.uid() = created_by));

create policy "calendar_events_select" on "public"."calendar_events"
  for select
  to PUBLIC
  using (((visibility = 'public'::text) or (auth.uid() = created_by)));

create policy "calendar_events_update" on "public"."calendar_events"
  for update
  to "authenticated"
  using ((auth.uid() = created_by));

create policy "calendar_reminders_delete" on "public"."calendar_reminders"
  for delete
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_reminders_insert" on "public"."calendar_reminders"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "calendar_reminders_select" on "public"."calendar_reminders"
  for select
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_reminders_update" on "public"."calendar_reminders"
  for update
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_user_calendar_delete" on "public"."calendar_user_calendar"
  for delete
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_user_calendar_insert" on "public"."calendar_user_calendar"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "calendar_user_calendar_select" on "public"."calendar_user_calendar"
  for select
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "calendar_user_calendar_update" on "public"."calendar_user_calendar"
  for update
  to "authenticated"
  using ((auth.uid() = user_id));

create policy "Categorias visiveis para todos" on "public"."categories"
  for select
  to PUBLIC
  using (true);

create policy "Leitura publica de codigos_postais_geo" on "public"."codigos_postais_geo"
  for select
  to PUBLIC
  using (true);

create policy "culturas_guia_read_public" on "public"."culturas_guia"
  for select
  to PUBLIC
  using (true);

create policy "Administradores gerem todos os pedidos" on "public"."entidade_pedidos"
  for all
  to "authenticated"
  using ((exists ( select 1
   from public.profiles p
  where ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))))
  with check ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))));

create policy "Utilizador cria o seu proprio pedido" on "public"."entidade_pedidos"
  for insert
  to "authenticated"
  with check (((profile_id IS NULL) OR (auth.uid() = profile_id)));

create policy "Utilizador ve os seus proprios pedidos" on "public"."entidade_pedidos"
  for select
  to "authenticated"
  using ((auth.uid() = profile_id));

create policy "Visitante cria pedido de registo institucional" on "public"."entidade_pedidos"
  for insert
  to "anon"
  with check (((profile_id IS NULL) AND (tipo_entidade = ANY (ARRAY['municipio'::text, 'freguesia'::text]))));

create policy "entidades_public_read" on "public"."entidades"
  for select
  to PUBLIC
  using ((estado = 'publicado'::text));

create policy "eventos_public_read" on "public"."eventos"
  for select
  to PUBLIC
  using ((estado = 'publicado'::text));

create policy "Leitura publica de freguesias" on "public"."freguesias"
  for select
  to PUBLIC
  using (true);

create policy "Leitura publica de localizacoes" on "public"."localizacoes"
  for select
  to "anon", "authenticated"
  using (true);

create policy "Anuncios ativos visiveis para todos" on "public"."marketplace_ads"
  for select
  to PUBLIC
  using ((status = 'active'::text));

create policy "Autores gerem os seus anuncios" on "public"."marketplace_ads"
  for all
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

create policy "Historico de lances visivel para todos" on "public"."marketplace_auction_bids"
  for select
  to PUBLIC
  using (true);

create policy "Licitadores criam os seus lances" on "public"."marketplace_auction_bids"
  for insert
  to PUBLIC
  with check (((auth.uid() = bidder_id) AND (NOT (EXISTS ( SELECT 1
   FROM (public.marketplace_auctions a
     JOIN public.marketplace_ads ad ON ((ad.id = a.ad_id)))
  WHERE ((a.id = marketplace_auction_bids.auction_id) AND (ad.author_id = auth.uid())))))));

create policy "Autores atualizam leiloes agendados" on "public"."marketplace_auctions"
  for update
  to PUBLIC
  using (((status = 'scheduled'::text) AND (exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_auctions.ad_id) AND (marketplace_ads.author_id = auth.uid()))))))
  with check (((status = 'scheduled'::text) AND (EXISTS ( SELECT 1
   FROM public.marketplace_ads
  WHERE ((marketplace_ads.id = marketplace_auctions.ad_id) AND (marketplace_ads.author_id = auth.uid()))))));

create policy "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_auctions.ad_id) AND (marketplace_ads.status = ANY (ARRAY['active'::text, 'sold'::text, 'expired'::text]))))));

create policy "Categorias visiveis a todos" on "public"."marketplace_categories"
  for select
  to PUBLIC
  using (true);

create policy "Users create conversations as buyer" on "public"."marketplace_conversations"
  for insert
  to PUBLIC
  with check ((auth.uid() = buyer_id));

create policy "Users see their conversations" on "public"."marketplace_conversations"
  for select
  to PUBLIC
  using (((auth.uid() = buyer_id) or (auth.uid() = seller_id)));

create policy "Users update their conversations" on "public"."marketplace_conversations"
  for update
  to PUBLIC
  using (((auth.uid() = buyer_id) or (auth.uid() = seller_id)));

create policy "Users add their own favorites" on "public"."marketplace_favorites"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "Users remove their own favorites" on "public"."marketplace_favorites"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Users see their own favorites" on "public"."marketplace_favorites"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Users add attachments to their messages" on "public"."marketplace_message_attachments"
  for insert
  to PUBLIC
  with check ((message_id IN ( SELECT m.id
   FROM (public.marketplace_messages m
     JOIN public.marketplace_conversations c ON ((m.conversation_id = c.id)))
  WHERE (((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())) AND (m.sender_id = auth.uid())))));

create policy "Users see attachments in their conversations" on "public"."marketplace_message_attachments"
  for select
  to PUBLIC
  using ((message_id in ( select m.id
   from (public.marketplace_messages m
     JOIN public.marketplace_conversations c on ((m.conversation_id = c.id)))
  where ((c.buyer_id = auth.uid()) or (c.seller_id = auth.uid())))));

create policy "Users mark their received messages as read" on "public"."marketplace_messages"
  for update
  to PUBLIC
  using (((conversation_id in ( select marketplace_conversations.id
   from public.marketplace_conversations
  where ((marketplace_conversations.buyer_id = auth.uid()) or (marketplace_conversations.seller_id = auth.uid())))) AND (sender_id <> auth.uid())));

create policy "Users see messages in their conversations" on "public"."marketplace_messages"
  for select
  to PUBLIC
  using ((conversation_id in ( select marketplace_conversations.id
   from public.marketplace_conversations
  where ((marketplace_conversations.buyer_id = auth.uid()) or (marketplace_conversations.seller_id = auth.uid())))));

create policy "Users send messages in their conversations" on "public"."marketplace_messages"
  for insert
  to PUBLIC
  with check (((auth.uid() = sender_id) AND (conversation_id IN ( SELECT marketplace_conversations.id
   FROM public.marketplace_conversations
  WHERE ((marketplace_conversations.buyer_id = auth.uid()) OR (marketplace_conversations.seller_id = auth.uid()))))));

create policy "Autores gerem fotos dos seus anuncios" on "public"."marketplace_photos"
  for all
  to PUBLIC
  using ((exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_photos.ad_id) AND (marketplace_ads.author_id = auth.uid())))));

create policy "Fotos de anuncios ativos visiveis" on "public"."marketplace_photos"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_photos.ad_id) AND (marketplace_ads.status = 'active'::text)))));

create policy "Municipios visiveis a todos" on "public"."municipios"
  for select
  to PUBLIC
  using (true);

create policy "Dono marca como lida" on "public"."notifications"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Notificacoes so visiveis para o dono" on "public"."notifications"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Sistema cria notificacoes" on "public"."notifications"
  for insert
  to "service_role"
  with check (true);

create policy "plantacao_historico_access" on "public"."plantacao_historico"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.plantacoes p
  where ((p.id = plantacao_historico.plantacao_id) AND (auth.uid() = p.utilizador_id)))));

create policy "plantacoes_user_access" on "public"."plantacoes"
  for all
  to PUBLIC
  using ((auth.uid() = utilizador_id));

create policy "users_can_create_own_plantacoes" on "public"."plantacoes"
  for insert
  to PUBLIC
  with check ((auth.uid() = utilizador_id));

create policy "users_can_delete_own_plantacoes" on "public"."plantacoes"
  for delete
  to PUBLIC
  using ((auth.uid() = utilizador_id));

create policy "users_can_update_own_plantacoes" on "public"."plantacoes"
  for update
  to PUBLIC
  using ((auth.uid() = utilizador_id))
  with check ((auth.uid() = utilizador_id));

create policy "users_can_view_own_plantacoes" on "public"."plantacoes"
  for select
  to PUBLIC
  using ((auth.uid() = utilizador_id));

create policy "Autores do post adicionam imagens" on "public"."post_images"
  for insert
  to PUBLIC
  with check ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_images.post_id) AND (posts.author_id = auth.uid())))));

create policy "Autores do post apagam imagens" on "public"."post_images"
  for delete
  to PUBLIC
  using ((exists ( select 1
   from public.posts
  where ((posts.id = post_images.post_id) AND (posts.author_id = auth.uid())))));

create policy "Imagens de posts visiveis para todos" on "public"."post_images"
  for select
  to PUBLIC
  using (true);

create policy "Autores apagam os seus posts" on "public"."posts"
  for delete
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Autores editam os seus posts" on "public"."posts"
  for update
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Posts visiveis para todos" on "public"."posts"
  for select
  to PUBLIC
  using (true);

create policy "Utilizadores autenticados criam posts" on "public"."posts"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

create policy "Perfis publicos visiveis para todos" on "public"."profiles"
  for select
  to PUBLIC
  using (true);

create policy "Sistema cria perfis automaticamente" on "public"."profiles"
  for insert
  to "service_role"
  with check (true);

create policy "Utilizadores editam o seu proprio perfil" on "public"."profiles"
  for update
  to "authenticated"
  using ((auth.uid() = id))
  with check ((auth.uid() = id));

create policy "recovery_codes_delete_own" on "public"."recovery_codes"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "recovery_codes_insert_own" on "public"."recovery_codes"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "recovery_codes_select_own" on "public"."recovery_codes"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "recovery_codes_update_own" on "public"."recovery_codes"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Refeições - SELECT públicas" on "public"."refeicoes_alojamento"
  for select
  to PUBLIC
  using (true);

create policy "Reservas alojamento - criar a propria" on "public"."reservas_alojamento"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "Reservas alojamento - editar propria ou staff" on "public"."reservas_alojamento"
  for update
  to "authenticated"
  using (((auth.uid() = user_id) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::public.user_role, 'admin'::public.user_role])))))))
  with check (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::public.user_role, 'admin'::public.user_role])))))));

create policy "Reservas alojamento - ver propria ou staff" on "public"."reservas_alojamento"
  for select
  to "authenticated"
  using (((auth.uid() = user_id) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['moderator'::public.user_role, 'admin'::public.user_role])))))));

create policy "Cancelar sua reserva" on "public"."restaurante_reservas"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Criar reserva com user_id" on "public"."restaurante_reservas"
  for insert
  to PUBLIC
  with check (((auth.uid() = user_id) OR (user_id IS NULL)));

create policy "Editar sua reserva" on "public"."restaurante_reservas"
  for update
  to PUBLIC
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Permitir criacao publica de reservas" on "public"."restaurante_reservas"
  for insert
  to "anon", "authenticated"
  with check (true);

create policy "Utilizador vê suas reservas" on "public"."restaurante_reservas"
  for select
  to PUBLIC
  using (((auth.uid() = user_id) or (auth.uid() is null)));

create policy "Leitura publica de restaurantes" on "public"."restaurantes"
  for select
  to "anon", "authenticated"
  using (true);

create policy "Autores editam os seus topicos" on "public"."threads"
  for update
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Topicos visiveis para todos" on "public"."threads"
  for select
  to PUBLIC
  using (true);

create policy "Utilizadores autenticados criam topicos" on "public"."threads"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

create policy "user_sessions_delete_own" on "public"."user_sessions"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "user_sessions_insert_own" on "public"."user_sessions"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "user_sessions_select_own" on "public"."user_sessions"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "user_sessions_update_own" on "public"."user_sessions"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

alter publication "supabase_realtime" add table "public"."calendar_events";

comment on column "public"."entidade_pedidos"."contacto_email" is 'Email institucional da entidade. Usado para comunicações do pedido e, após validação, para o acesso institucional (SSO por domínio previsto, ainda não implementado).';

comment on column "public"."entidade_pedidos"."presidente_nome" is 'Nome do Presidente da Câmara/Junta — apenas o nome (minimização de dados, ver docs/PARCEIROS-ENTRADA.md).';

comment on column "public"."entidade_pedidos"."responsavel_nome" is 'Nome da pessoa responsável operacional pela informação da entidade no OTJ. Não é a entidade nem, por definição, o Presidente.';

comment on column "public"."freguesias"."cod_ine" is 'Código INE (Instituto Nacional de Estatística) da freguesia';

comment on column "public"."freguesias"."email" is 'Email de contacto da junta de freguesia';

comment on column "public"."freguesias"."nif" is 'NIF (Número de Identificação Fiscal) da junta de freguesia';

comment on column "public"."freguesias"."presidente" is 'Nome do presidente da junta de freguesia';

comment on column "public"."freguesias"."telefone" is 'Telefone de contacto da junta de freguesia';

comment on extension "pg_cron" is 'Job scheduler for PostgreSQL';

comment on extension "unaccent" is 'text search dictionary that removes accents';

comment on table "public"."freguesias" is 'Tabela contendo informações de todas as freguesias de Portugal';

grant execute on function "public"."check_username_availability"(text) to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."generate_username"(text) to public, "anon", "authenticated", "postgres", "service_role";

grant execute
  on function "public"."geo_distance"(double precision, double precision, double precision, double precision, character varying)
  to public, "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."gran_bazar_advance_auctions"() from public;

grant execute on function "public"."gran_bazar_advance_auctions"() to "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."gran_bazar_create_auction_if_needed"() to public, "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."gran_bazar_place_bid"(bigint, numeric, text) from public;

grant execute on function "public"."gran_bazar_place_bid"(bigint, numeric, text) to "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."handle_new_post"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."handle_new_user"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."handle_updated_at"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."notify_thread_author"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."set_updated_at"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."uuid_generate_v4"() to public, "anon", "authenticated", "postgres", "service_role";

grant execute on function "public"."validar_entidade_pedido_participar"() to public, "anon", "authenticated", "postgres", "service_role";

grant create, usage on schema "codigos_postais" to "postgres";

grant select, update, usage on sequence "public"."arteria_codigo_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."arteria_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."arteria_local_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."arteria_nome_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."arteria_tipo_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."arteria_titulo_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."categories_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."codigo_postal_arteria_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."codigo_postal_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."concelho_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."designacao_postal_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."distrito_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."freguesia_audit_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."freguesias_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."localidade_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_ads_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_categories_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_conversations_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_favorites_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_message_attachments_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_messages_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."marketplace_photos_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."municipios_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_app_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_app_meta_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_app_table_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_auth_jwt_token_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_client_hit_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_client_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_design_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_group_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_group_rule_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_log_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_statistic_average_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_statistic_average_type_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_statistic_moment_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_statistic_type_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_table_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_user_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."netuno_user_rule_id" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."notifications_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."posts_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."threads_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."username_history_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_codigo" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_local" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_nome" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_tipo" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."arteria_titulo" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."codigo_postal" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."codigo_postal_arteria" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."concelho" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."designacao_postal" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."distrito" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."localidade" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app_meta" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_app_table" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_client" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_client_hit" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_design" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_group" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_group_rule" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_log" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_average" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_average_type" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_moment" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_statistic_type" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_table" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_user" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "codigos_postais"."netuno_user_rule" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."alojamentos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_codigo" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_local" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_nome" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_tipo" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."arteria_titulo" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."audit_log" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_categories" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_event_favorites" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_event_images" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_event_participants" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_events" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_reminders" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_user_calendar" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."categorias_entidade" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."categories" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigo_postal" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigo_postal_arteria" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."codigos_postais_geo" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."concelho" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_aptidoes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_guia" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."culturas_guia_backup_20260819"
  to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."culturas_guia_backup_20260820"
  to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."culturas_guia_backup_fase7_20260820"
  to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."culturas_produtos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."designacao_postal" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."distrito" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."entidade_pedidos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."entidade_relacoes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."entidades" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."eventos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."freguesia_audit" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."freguesias" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."horarios" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."horarios_excecoes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."localidade" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."localizacoes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_ads" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_auction_bids" to "anon", "authenticated", "postgres", "service_role";

revoke all on table "public"."marketplace_auctions" from "anon";

grant maintain, references, select, trigger, truncate, update on table "public"."marketplace_auctions" to "anon";

revoke all on table "public"."marketplace_auctions" from "authenticated";

grant maintain, references, select, trigger, truncate, update on table "public"."marketplace_auctions" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_auctions" to "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_categories" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_conversations" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_favorites" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."marketplace_message_attachments"
  to "anon", "authenticated", "postgres", "service_role";

revoke all on table "public"."marketplace_messages" from "anon";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."marketplace_messages" to "anon";

revoke all ("read_at") on table "public"."marketplace_messages" from "authenticated";

grant update ("read_at") on table "public"."marketplace_messages" to "authenticated";

revoke all on table "public"."marketplace_messages" from "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."marketplace_messages" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_messages" to "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_photos" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."municipios" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app_meta" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_app_table" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_auth_jwt_token" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_client" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_client_hit" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_design" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_group" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_group_rule" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_log" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_statistic_average" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."netuno_statistic_average_type"
  to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_statistic_moment" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_statistic_type" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_table" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_user" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_user_rule" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."notifications" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."plantacao_historico" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."plantacoes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."post_images" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."posts" to "anon", "authenticated", "postgres", "service_role";

revoke all on table "public"."profiles" from "anon";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."profiles" to "anon";

revoke all ("avatar_url") on table "public"."profiles" from "authenticated";

grant update ("avatar_url") on table "public"."profiles" to "authenticated";

revoke all ("bio") on table "public"."profiles" from "authenticated";

grant update ("bio") on table "public"."profiles" to "authenticated";

revoke all ("display_name") on table "public"."profiles" from "authenticated";

grant update ("display_name") on table "public"."profiles" to "authenticated";

revoke all ("location") on table "public"."profiles" from "authenticated";

grant update ("location") on table "public"."profiles" to "authenticated";

revoke all ("mfa_setup_dismissed_at") on table "public"."profiles" from "authenticated";

grant update ("mfa_setup_dismissed_at") on table "public"."profiles" to "authenticated";

revoke all ("username") on table "public"."profiles" from "authenticated";

grant update ("username") on table "public"."profiles" to "authenticated";

revoke all on table "public"."profiles" from "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."profiles" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."recovery_codes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."refeicoes_alojamento" to "anon", "authenticated", "postgres", "service_role";

revoke all on table "public"."reservas_alojamento" from "authenticated";

grant insert, select, update on table "public"."reservas_alojamento" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."reservas_alojamento" to "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."reserved_usernames" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."restaurante_reservas" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."restaurantes" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."threads" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."tipos_alojamento" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."user_sessions" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."username_history" to "anon", "authenticated", "postgres", "service_role";

grant usage on type "public"."user_role" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_events_public" to "anon", "authenticated", "postgres", "service_role";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "anon";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "authenticated";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "anon";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "authenticated";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "anon";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "authenticated";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "service_role";

select cron.schedule_in_database('gran-bazar-advance-auctions', '*/5 * * * *', ' select public.gran_bazar_advance_auctions(); ', 'postgres', null, true);

select cron.schedule_in_database('gran-bazar-leiloes-avancar', '* * * * *', 'select public.gran_bazar_advance_auctions();', 'postgres', null, true);

alter table "public"."arteria"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."arteria_codigo"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."arteria_local"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."arteria_nome"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."arteria_tipo"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."arteria_titulo"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."codigo_postal"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."codigo_postal_arteria"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."concelho"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."designacao_postal"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."distrito"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."localidade"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_app"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_app_meta"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_app_table"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_auth_jwt_token"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_client"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_client_hit"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_design"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_group"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_group_rule"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_log"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_statistic_average"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_statistic_average_type"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_statistic_moment"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_statistic_type"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_table"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_user"
  add column "uid" uuid default public.uuid_generate_v4();

alter table "public"."netuno_user_rule"
  add column "uid" uuid default public.uuid_generate_v4();

