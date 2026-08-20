create table "public"."username_history" (
  "id"           integer                  not null default nextval('public.username_history_id_seq'::regclass),
  "user_id"      uuid,
  "old_username" text                     not null,
  "new_username" text,
  "changed_at"   timestamp with time zone default now(),
  constraint "username_history_pkey" primary key (id),
  constraint "username_history_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."username_history"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."username_history" to "anon", "authenticated", "postgres", "service_role";
