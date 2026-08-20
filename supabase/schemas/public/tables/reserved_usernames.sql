create table "public"."reserved_usernames" (
  "username" text collate pg_catalog."C" not null,
  constraint "reserved_usernames_pkey" primary key (username)
);

alter table "public"."reserved_usernames"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."reserved_usernames" to "anon", "authenticated", "postgres", "service_role";
