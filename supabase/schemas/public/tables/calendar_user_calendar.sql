create table "public"."calendar_user_calendar" (
  "id"               uuid                     not null default gen_random_uuid(),
  "user_id"          uuid                     not null,
  "event_id"         uuid                     not null,
  "reminder_minutes" integer,
  "created_at"       timestamp with time zone default now(),
  constraint "calendar_user_calendar_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade,
  constraint "calendar_user_calendar_pkey" primary key (id),
  constraint "calendar_user_calendar_user_id_event_id_key" unique (user_id, event_id),
  constraint "calendar_user_calendar_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."calendar_user_calendar"
  enable row level security;

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_user_calendar" to "anon", "authenticated", "postgres", "service_role";
