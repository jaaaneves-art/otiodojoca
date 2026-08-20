create table "public"."calendar_categories" (
  "id"          uuid                     not null default gen_random_uuid(),
  "name"        text                     not null,
  "slug"        text                     not null,
  "description" text,
  "color"       text,
  "icon"        text,
  "sort_order"  integer                  default 0,
  "is_active"   boolean                  default true,
  "created_at"  timestamp with time zone default now(),
  "updated_at"  timestamp with time zone default now(),
  constraint "calendar_categories_pkey" primary key (id),
  constraint "calendar_categories_slug_key" unique (slug)
);

alter table "public"."calendar_categories"
  enable row level security;

create trigger trg_calendar_categories_updated_at
  before update on public.calendar_categories
  for each row
  execute function public.set_updated_at();

create policy "calendar_categories_select" on "public"."calendar_categories"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_categories" to "anon", "authenticated", "postgres", "service_role";
