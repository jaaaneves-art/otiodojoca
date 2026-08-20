create table "public"."calendar_event_images" (
  "id"           uuid                     not null default gen_random_uuid(),
  "event_id"     uuid                     not null,
  "storage_path" text                     not null,
  "file_name"    text,
  "alt_text"     text,
  "is_cover"     boolean                  default false,
  "sort_order"   integer                  default 0,
  "created_at"   timestamp with time zone default now(),
  constraint "calendar_event_images_pkey" primary key (id),
  constraint "calendar_event_images_event_id_fkey" foreign key (event_id) references public.calendar_events(id) on delete cascade
);

alter table "public"."calendar_event_images"
  enable row level security;

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

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_event_images" to "anon", "authenticated", "postgres", "service_role";
