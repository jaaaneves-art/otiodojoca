create table "public"."threads" (
  "id"            integer                  not null default nextval('public.threads_id_seq'::regclass),
  "category_id"   integer                  not null,
  "author_id"     uuid                     not null,
  "title"         text                     not null,
  "slug"          text                     not null,
  "is_pinned"     boolean                  default false,
  "is_locked"     boolean                  default false,
  "views"         integer                  default 0,
  "replies_count" integer                  default 0,
  "last_post_at"  timestamp with time zone default now(),
  "created_at"    timestamp with time zone default now(),
  constraint "threads_author_id_fkey" foreign key (author_id) references public.profiles(id),
  constraint "threads_category_id_fkey" foreign key (category_id) references public.categories(id),
  constraint "threads_category_id_slug_key" unique (category_id, slug),
  constraint "threads_pkey" primary key (id)
);

alter table "public"."threads"
  enable row level security;

alter table "public"."threads"
  add column "search_vector" tsvector generated always as (to_tsvector('portuguese'::regconfig, title)) stored;

create index idx_threads_category on public.threads using btree (category_id, is_pinned desc, last_post_at desc);

create index idx_threads_search on public.threads using gin (search_vector);

create policy "Autores editam os seus topicos" on "public"."threads"
  for update
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Topicos visiveis para todos" on "public"."threads"
  for select
  to PUBLIC
  using (true);

create policy "Utilizadores autenticados criam topicos" on "public"."threads"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."threads" to "anon", "authenticated", "postgres", "service_role";
