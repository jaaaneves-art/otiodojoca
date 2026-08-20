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
  constraint "user_sessions_pkey" primary key (id),
  constraint "user_sessions_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade
);

alter table "public"."user_sessions"
  enable row level security;

create index user_sessions_last_seen_idx on public.user_sessions using btree (last_seen);

create index user_sessions_revoked_idx on public.user_sessions using btree (revoked)
  where (revoked = false);

create index user_sessions_user_id_idx on public.user_sessions using btree (user_id);

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."user_sessions" to "anon", "authenticated", "postgres", "service_role";
