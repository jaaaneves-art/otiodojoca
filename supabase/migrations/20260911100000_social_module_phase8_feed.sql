-- Fase 8: feed social e publicacoes. Aplicar depois das Fases 3-7.
-- Reutiliza o bucket privado social-message-media e preserva os marketplaces.
begin;

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 3000),
  visibility text not null default 'public' check (visibility = 'public'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.social_posts enable row level security;
create index social_posts_feed on public.social_posts(created_at desc, id desc)
  where deleted_at is null and visibility = 'public';
create index social_posts_author on public.social_posts(author_id, created_at desc);
create policy "Membros veem publicacoes ativas" on public.social_posts
for select to authenticated using (deleted_at is null and visibility = 'public');
revoke all on public.social_posts from public, anon, authenticated;
grant select on public.social_posts to authenticated;
grant all on public.social_posts to service_role;

create table public.social_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  storage_provider text not null default 'supabase' check (storage_provider = 'supabase'),
  storage_key text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  constraint social_post_media_one_per_post unique (post_id),
  constraint social_post_media_storage_key_key unique (storage_key)
);
alter table public.social_post_media enable row level security;
create policy "Membros veem imagens de publicacoes ativas" on public.social_post_media
for select to authenticated using (
  not public.social_media_is_claimed(storage_key)
  and exists (
    select 1 from public.social_posts p
    where p.id = post_id and p.deleted_at is null and p.visibility = 'public'
  )
);
revoke all on public.social_post_media from public, anon, authenticated;
grant select on public.social_post_media to authenticated;
grant all on public.social_post_media to service_role;

create or replace function public.social_create_post(p_content text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_content text := btrim(coalesce(p_content, ''));
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Autenticacao necessaria' using errcode = '42501';
  end if;
  if char_length(v_content) not between 1 and 3000 then
    raise exception 'Publicacao invalida' using errcode = '22023';
  end if;

  -- Serializa os envios do mesmo utilizador e torna um duplo clique idempotente.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 8));
  select id into v_id from public.social_posts
  where author_id = v_user and content = v_content and deleted_at is null
    and created_at > statement_timestamp() - interval '2 minutes'
  order by created_at desc, id desc limit 1;
  if v_id is not null then return v_id; end if;

  if (select count(*) from public.social_posts
      where author_id = v_user and created_at > statement_timestamp() - interval '1 hour') >= 20 then
    raise exception 'Limite temporario de publicacoes atingido' using errcode = '54000';
  end if;

  insert into public.social_posts(author_id, content)
  values (v_user, v_content) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.social_create_post(text) from public, anon;
grant execute on function public.social_create_post(text) to authenticated;

-- O mesmo bucket serve mensagens, grupos e agora imagens do feed. A primeira
-- parte da chave e sempre o recurso, a segunda e sempre o utilizador.
create or replace function public.social_media_can_upload(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.social_media_valid_key(p_key)
    and split_part(p_key, '/', 2) = auth.uid()::text
    and (
      exists (select 1 from public.conversations c
        where c.id::text = split_part(p_key, '/', 1)
          and public.is_conversation_participant(c.id))
      or exists (select 1 from public.social_posts p
        where p.id::text = split_part(p_key, '/', 1)
          and p.author_id = auth.uid() and p.deleted_at is null)
    )
    and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = p_key)
    and not exists (select 1 from public.message_media mm
      where mm.storage_provider = 'supabase' and mm.storage_key = p_key)
    and not exists (select 1 from public.social_post_media pm
      where pm.storage_provider = 'supabase' and pm.storage_key = p_key);
$$;
revoke all on function public.social_media_can_upload(text) from public;
grant execute on function public.social_media_can_upload(text) to anon, authenticated, service_role;

create or replace function public.social_media_can_read(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = p_key)
    and (
      exists (select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
        where mm.storage_provider = 'supabase' and mm.storage_key = p_key
          and m.deleted_at is null and (mm.expires_at is null or mm.expires_at > now())
          and public.is_conversation_participant(m.conversation_id))
      or exists (select 1 from public.social_post_media pm
        join public.social_posts p on p.id = pm.post_id
        where pm.storage_provider = 'supabase' and pm.storage_key = p_key
          and p.deleted_at is null and p.visibility = 'public')
    );
$$;
revoke all on function public.social_media_can_read(text) from public;
grant execute on function public.social_media_can_read(text) to anon, authenticated, service_role;

create or replace function public.social_attach_post_media(
  p_post uuid, p_key text, p_mime text, p_size bigint
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_existing_key text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.social_posts p
    where p.id = p_post and p.author_id = auth.uid() and p.deleted_at is null
  ) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  if split_part(p_key, '/', 1) is distinct from p_post::text
    or split_part(p_key, '/', 2) is distinct from auth.uid()::text
    or p_mime not in ('image/jpeg','image/png','image/webp')
    or p_size not between 1 and 5242880
    or not public.social_media_exists(p_key, p_mime, p_size) then
    raise exception 'Imagem invalida' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key, 5));
  select id, storage_key into v_id, v_existing_key
  from public.social_post_media where post_id = p_post;
  if v_id is not null then
    if v_existing_key = p_key then return v_id; end if;
    raise exception 'A publicacao ja tem uma imagem' using errcode = '23505';
  end if;
  if public.social_media_is_claimed(p_key)
    or exists (select 1 from public.message_media where storage_provider = 'supabase' and storage_key = p_key)
    or exists (select 1 from public.social_post_media where storage_provider = 'supabase' and storage_key = p_key) then
    raise exception 'Imagem indisponivel' using errcode = '23505';
  end if;

  insert into public.social_post_media(post_id, storage_key, mime_type, size_bytes)
  values (p_post, p_key, p_mime, p_size) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.social_attach_post_media(uuid, text, text, bigint) from public, anon;
grant execute on function public.social_attach_post_media(uuid, text, text, bigint) to authenticated;

create or replace function public.social_delete_post(p_post uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.social_posts set deleted_at = statement_timestamp(), updated_at = statement_timestamp()
  where id = p_post and author_id = auth.uid() and deleted_at is null;
  return found;
end;
$$;
revoke all on function public.social_delete_post(uuid) from public, anon;
grant execute on function public.social_delete_post(uuid) to authenticated;

create or replace function public.social_abandon_upload(p_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.social_media_valid_key(p_key)
    or split_part(p_key, '/', 2) is distinct from auth.uid()::text
    or not (
      exists (select 1 from public.conversations c
        where c.id::text = split_part(p_key, '/', 1) and public.is_conversation_participant(c.id))
      or exists (select 1 from public.social_posts p
        where p.id::text = split_part(p_key, '/', 1) and p.author_id = auth.uid())
    ) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key, 5));
  if exists (select 1 from public.message_media where storage_provider = 'supabase' and storage_key = p_key)
    or exists (select 1 from public.social_post_media where storage_provider = 'supabase' and storage_key = p_key) then
    return false;
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'social-message-media' and name = p_key) then
    return false;
  end if;
  insert into public.social_media_cleanup_jobs(storage_key, reason) values (p_key, 'abandoned')
    on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.social_abandon_upload(text) from public;
grant execute on function public.social_abandon_upload(text) to authenticated;

create or replace function public.social_claim_media_cleanup(p_limit integer default 100, p_apply boolean default false)
returns table(storage_key text, reason text)
language plpgsql security definer set search_path = '' as $$
declare v_key text; v_reason text; v_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'Limite invalido'; end if;
  for v_key, v_reason in select j.storage_key, j.reason from public.social_media_cleanup_jobs j
    where j.completed_at is null order by j.last_attempt_at nulls first, j.created_at limit p_limit
  loop
    storage_key := v_key; reason := v_reason; return next; v_count := v_count + 1;
  end loop;
  if v_count >= p_limit then return; end if;
  for v_key in select o.name from storage.objects o
    where o.bucket_id = 'social-message-media'
      and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = o.name)
      and o.created_at < now() - interval '24 hours'
      and not exists (
        select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
        where mm.storage_provider = 'supabase' and mm.storage_key = o.name
          and not ((m.deleted_at is not null and m.deleted_at < now() - interval '30 days')
            or (mm.expires_at is not null and mm.expires_at < now() - interval '24 hours')))
      and not exists (
        select 1 from public.social_post_media pm join public.social_posts p on p.id = pm.post_id
        where pm.storage_provider = 'supabase' and pm.storage_key = o.name
          and not (p.deleted_at is not null and p.deleted_at < now() - interval '30 days'))
    order by o.created_at, o.name limit p_limit * 10
  loop
    if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 5)) then continue; end if;
    if exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = v_key) then continue; end if;
    if exists (
      select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
      where mm.storage_provider = 'supabase' and mm.storage_key = v_key
        and not ((m.deleted_at is not null and m.deleted_at < now() - interval '30 days')
          or (mm.expires_at is not null and mm.expires_at < now() - interval '24 hours')))
      or exists (
        select 1 from public.social_post_media pm join public.social_posts p on p.id = pm.post_id
        where pm.storage_provider = 'supabase' and pm.storage_key = v_key
          and not (p.deleted_at is not null and p.deleted_at < now() - interval '30 days')) then
      continue;
    end if;
    v_reason := case when
      exists (select 1 from public.message_media mm where mm.storage_provider = 'supabase' and mm.storage_key = v_key)
      or exists (select 1 from public.social_post_media pm where pm.storage_provider = 'supabase' and pm.storage_key = v_key)
      then 'retention' else 'orphan' end;
    if p_apply then
      insert into public.social_media_cleanup_jobs(storage_key, reason) values (v_key, v_reason);
    end if;
    storage_key := v_key; reason := v_reason; return next; v_count := v_count + 1;
    exit when v_count >= p_limit;
  end loop;
end;
$$;
revoke all on function public.social_claim_media_cleanup(integer, boolean) from public, anon, authenticated;
grant execute on function public.social_claim_media_cleanup(integer, boolean) to service_role;

do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'social_posts') then
    alter publication supabase_realtime add table public.social_posts;
  end if;
end $$;

commit;
