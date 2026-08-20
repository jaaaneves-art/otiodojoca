create table "public"."netuno_client_hit" (
  "id"        integer                     not null,
  "client_id" integer                     default 0,
  "user_id"   integer                     default 0,
  "moment"    timestamp without time zone default current_timestamp,
  constraint "netuno_client_hit_pkey" primary key (id)
);

create index netuno_client_hit_client_id_idx on public.netuno_client_hit using btree (client_id);

create index netuno_client_hit_user_id_idx on public.netuno_client_hit using btree (user_id);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."netuno_client_hit" to "anon", "authenticated", "postgres", "service_role";

alter table "public"."netuno_client_hit"
  add column "uid" uuid default public.uuid_generate_v4();
