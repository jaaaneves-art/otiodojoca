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
  constraint "calendar_events_category_id_fkey" foreign key (category_id) references public.calendar_categories(id) on delete set null,
  constraint "calendar_events_created_by_fkey" foreign key (created_by) references auth.users(id) on delete cascade,
  constraint "calendar_events_pkey" primary key (id),
  constraint "calendar_events_slug_key" unique (slug)
);

alter table "public"."calendar_events"
  enable row level security;

create index idx_calendar_events_category on public.calendar_events using btree (category_id);

create index idx_calendar_events_creator on public.calendar_events using btree (created_by);

create index idx_calendar_events_end on public.calendar_events using btree (ends_at);

create index idx_calendar_events_start on public.calendar_events using btree (starts_at);

create index idx_calendar_events_status on public.calendar_events using btree (status);

create index idx_calendar_events_visibility on public.calendar_events using btree (visibility);

create trigger trg_calendar_events_updated_at
  before update on public.calendar_events
  for each row
  execute function public.set_updated_at();

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_events" to "anon", "authenticated", "postgres", "service_role";
