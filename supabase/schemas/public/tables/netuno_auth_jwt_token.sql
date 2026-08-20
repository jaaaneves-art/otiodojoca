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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_auth_jwt_token" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_auth_jwt_token"
  add column "uid" uuid default public.uuid_generate_v4();
