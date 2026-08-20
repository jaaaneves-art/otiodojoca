create table "public"."calendar_reminders" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "event_id"   uuid                     not null,
  "remind_at"  timestamp with time zone not null,
  "sent"       boolean                  default false,
  "created_at" timestamp with time zone default now(),
  constraint "calendar_reminders_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade,
  constraint "calendar_reminders_pkey" primary key (id),
  constraint "calendar_reminders_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."calendar_reminders"
  enable row level security;

create index idx_calendar_reminders_time on public.calendar_reminders using btree (remind_at);

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_reminders" to "anon", "authenticated", "postgres", "service_role";
