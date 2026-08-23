-- ============================================================
-- FORUM: suporte a fotos nos tópicos/respostas
-- ============================================================
-- Segue o mesmo padrão já usado em marketplace_photos /
-- marketplace-images: uma tabela de metadados (post_images) mais um
-- bucket de Storage público para leitura, com upload restrito a
-- utilizadores autenticados.

create table if not exists "public"."post_images" (
  "id"           bigint generated always as identity primary key,
  "post_id"      integer not null references public.posts(id) on delete cascade,
  "storage_path" text not null,
  "sort_order"   integer not null default 0,
  "created_at"   timestamp with time zone not null default now()
);

create index if not exists idx_post_images_post on public.post_images using btree (post_id);

alter table "public"."post_images" enable row level security;

drop policy if exists "Imagens de posts visiveis para todos" on "public"."post_images";
create policy "Imagens de posts visiveis para todos" on "public"."post_images"
  for select
  to public
  using (true);

drop policy if exists "Autores do post adicionam imagens" on "public"."post_images";
create policy "Autores do post adicionam imagens" on "public"."post_images"
  for insert
  to public
  with check (
    exists (
      select 1 from public.posts
      where posts.id = post_id
        and posts.author_id = auth.uid()
    )
  );

drop policy if exists "Autores do post apagam imagens" on "public"."post_images";
create policy "Autores do post apagam imagens" on "public"."post_images"
  for delete
  to public
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_id
        and posts.author_id = auth.uid()
    )
  );

grant delete, insert, select, update on table "public"."post_images" to "anon", "authenticated", "postgres", "service_role";

-- Bucket de Storage (público para leitura, só autenticados podem enviar)
insert into storage.buckets (id, name, public)
values ('forum-images', 'forum-images', true)
on conflict (id) do nothing;

drop policy if exists "Forum images - leitura publica" on storage.objects;
create policy "Forum images - leitura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'forum-images');

drop policy if exists "Forum images - upload autenticado" on storage.objects;
create policy "Forum images - upload autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'forum-images');

drop policy if exists "Forum images - autor apaga as suas imagens" on storage.objects;
create policy "Forum images - autor apaga as suas imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'forum-images' and owner = auth.uid());
