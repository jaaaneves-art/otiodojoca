create table "public"."calendar_event_favorites" (
  "id"         uuid                     not null default gen_random_uuid(),
  "event_id"   uuid                     not null,
  "user_id"    uuid                     not null,
  "created_at" timestamp with time zone default now(),
  constraint "calendar_event_favorites_event_id_user_id_key" unique (event_id, user_id),
  constraint "calendar_event_favorites_pkey" primary key (id),
  constraint "calendar_event_favorites_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade,
  constraint "calendar_event_favorites_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade
);

alter table "public"."calendar_event_favorites"
  enable row level security;

create index idx_calendar_favorites_user on public.calendar_event_favorites using btree (user_id);

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_event_favorites" to "anon", "authenticated", "postgres", "service_role";
