create table "public"."marketplace_categories" (
  "id"         bigint                      not null default nextval('public.marketplace_categories_id_seq'::regclass),
  "name"       character varying(100),
  "slug"       character varying(100),
  "icon"       character varying(50),
  "created_at" timestamp without time zone default now(),
  constraint "marketplace_categories_name_key" unique (name),
  constraint "marketplace_categories_pkey" primary key (id),
  constraint "marketplace_categories_slug_key" unique (slug)
);

alter table "public"."marketplace_categories"
  enable row level security;

create policy "Categorias visiveis a todos" on "public"."marketplace_categories"
  for select
  to PUBLIC
  using (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_categories" to "anon", "authenticated", "postgres", "service_role";
