create table "public"."categories" (
  "id"          integer                  not null default nextval('public.categories_id_seq'::regclass),
  "name"        text                     not null,
  "slug"        text                     not null,
  "type"        text                     not null,
  "parent_id"   integer,
  "description" text,
  "icon"        text                     default '🌱'::text,
  "sort_order"  integer                  default 0,
  "created_at"  timestamp with time zone default now(),
  constraint "categories_pkey" primary key (id),
  constraint "categories_parent_id_fkey" foreign key (parent_id) references public.categories(id),
  constraint "categories_slug_key" unique (slug),
  constraint "categories_type_check" check ((type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text])))
);

alter table "public"."categories"
  enable row level security;

create policy "Categorias visiveis para todos" on "public"."categories"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."categories" to "anon", "authenticated", "postgres", "service_role";
