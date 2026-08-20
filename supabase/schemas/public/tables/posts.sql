create table "public"."posts" (
  "id"            integer                  not null default nextval('public.posts_id_seq'::regclass),
  "thread_id"     integer                  not null,
  "author_id"     uuid                     not null,
  "content"       text                     not null,
  "is_first_post" boolean                  default false,
  "created_at"    timestamp with time zone default now(),
  "updated_at"    timestamp with time zone default now(),
  constraint "posts_pkey" primary key (id),
  constraint "posts_author_id_fkey" foreign key (author_id) references public.profiles(id),
  constraint "posts_thread_id_fkey" foreign key (thread_id) references public.threads(id) on delete cascade
);

alter table "public"."posts"
  enable row level security;

create index idx_posts_thread on public.posts using btree (thread_id, created_at);

create trigger on_post_created
  after insert on public.posts
  for each row
  execute function public.handle_new_post();

create trigger on_post_notify
  after insert on public.posts
  for each row
  execute function public.notify_thread_author();

create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

create policy "Autores apagam os seus posts" on "public"."posts"
  for delete
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Autores editam os seus posts" on "public"."posts"
  for update
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Posts visiveis para todos" on "public"."posts"
  for select
  to PUBLIC
  using (true);

create policy "Utilizadores autenticados criam posts" on "public"."posts"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."posts" to "anon", "authenticated", "postgres", "service_role";
