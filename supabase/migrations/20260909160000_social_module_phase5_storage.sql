-- Fase 5. Local/revisão: não aplicar automaticamente. Requer Fase 4.
-- Atualiza o bucket existente, sem criar outro nem tocar nos marketplaces.
begin;
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'social-message-media') then
    raise exception 'Aplicar primeiro a migration social da Fase 4';
  end if;
end $$;
update storage.buckets set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf','video/mp4']
where id = 'social-message-media';

-- Tombstones persistem depois da remoção física: uma chave nunca é reutilizada.
create table public.social_media_cleanup_jobs (
  storage_key text primary key,
  reason text not null check (reason in ('abandoned','orphan','retention')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  attempts integer not null default 0,
  last_attempt_at timestamptz
);
alter table public.social_media_cleanup_jobs enable row level security;
revoke all on public.social_media_cleanup_jobs from public, anon, authenticated;
grant select, insert, update on public.social_media_cleanup_jobs to service_role;
create index social_media_cleanup_pending on public.social_media_cleanup_jobs(created_at)
  where completed_at is null;
create index social_media_storage_key on public.message_media(storage_key)
  where storage_provider = 'supabase';

create or replace function public.social_media_valid_key(p_key text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false);
$$;
revoke all on function public.social_media_valid_key(text) from public;
grant execute on function public.social_media_valid_key(text) to authenticated, service_role;

-- Helpers globais: uma associação escondida pela RLS nunca se torna um órfão.
create or replace function public.social_media_can_upload(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.social_media_valid_key(p_key)
    and split_part(p_key, '/', 2) = auth.uid()::text
    and exists (select 1 from public.conversations c where c.id::text = split_part(p_key, '/', 1)
      and c.type = 'direct' and public.is_conversation_participant(c.id))
    and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = p_key)
    and not exists (select 1 from public.message_media mm
      where mm.storage_provider = 'supabase' and mm.storage_key = p_key);
$$;
revoke all on function public.social_media_can_upload(text) from public;
grant execute on function public.social_media_can_upload(text) to anon, authenticated, service_role;

create or replace function public.social_media_can_read(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = p_key)
    and exists (select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
      where mm.storage_provider = 'supabase' and mm.storage_key = p_key
        and m.deleted_at is null and (mm.expires_at is null or mm.expires_at > now())
        and public.is_conversation_participant(m.conversation_id));
$$;
revoke all on function public.social_media_can_read(text) from public;
grant execute on function public.social_media_can_read(text) to anon, authenticated, service_role;

create or replace function public.social_media_exists(p_key text, p_mime text, p_size bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.social_media_valid_key(p_key)
    and split_part(p_key, '/', 2) = auth.uid()::text
    and p_mime in ('image/jpeg','image/png','image/webp','application/pdf','video/mp4')
    and p_size between 1 and 5242880
    and not exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = p_key)
    and exists (select 1 from storage.objects o where o.bucket_id = 'social-message-media'
      and o.name = p_key and o.metadata->>'mimetype' = p_mime
      and case when o.metadata->>'size' ~ '^[0-9]{1,10}$'
        then (o.metadata->>'size')::bigint = p_size else false end);
$$;
revoke all on function public.social_media_exists(text, text, bigint) from public;
grant execute on function public.social_media_exists(text, text, bigint) to authenticated, service_role;

drop policy "social media upload" on storage.objects;
drop policy "social media read" on storage.objects;
drop policy "social media orphan read" on storage.objects;
drop policy "social media cleanup" on storage.objects;
create policy "social media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'social-message-media' and public.social_media_can_upload(name));
create policy "social media read" on storage.objects for select to authenticated
  using (bucket_id = 'social-message-media' and public.social_media_can_read(name));
-- Restritivas: mesmo uma policy permissiva externa não abre este bucket.
-- A expressão é verdadeira para todos os outros buckets: não muda os seus acessos.
create policy "social media select guard" on storage.objects as restrictive for select to public
  using (bucket_id <> 'social-message-media' or
    (auth.role() = 'authenticated' and public.social_media_can_read(name)));
create policy "social media insert guard" on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'social-message-media' or
    (auth.role() = 'authenticated' and public.social_media_can_upload(name)));
create policy "social media update guard" on storage.objects as restrictive for update to public
  using (bucket_id <> 'social-message-media') with check (bucket_id <> 'social-message-media');
create policy "social media delete guard" on storage.objects as restrictive for delete to public
  using (bucket_id <> 'social-message-media');

-- Metadados apagados/expirados também ficam invisíveis. Não se altera conteúdo histórico.
drop policy "Participantes veem media das suas conversas" on public.message_media;
create or replace function public.social_media_is_claimed(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.social_media_cleanup_jobs where storage_key = p_key);
$$;
revoke all on function public.social_media_is_claimed(text) from public;
grant execute on function public.social_media_is_claimed(text) to authenticated, service_role;
create policy "Participantes veem media das suas conversas" on public.message_media
for select to authenticated using (
  (expires_at is null or expires_at > now()) and exists (
    select 1 from public.messages m where m.id = message_id and m.deleted_at is null
      and public.is_conversation_participant(m.conversation_id))
  and (storage_provider <> 'supabase' or not public.social_media_is_claimed(storage_key))
);

-- Serializa associação e limpeza pela mesma chave, incluindo INSERT direto via REST.
create or replace function public.social_media_guard_link()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_provider = 'supabase' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.storage_key, 5));
    if public.social_media_is_claimed(new.storage_key) then
      raise exception 'Anexo em limpeza' using errcode = '42501';
    end if;
  end if;
  if auth.role() = 'authenticated' then
    if TG_OP <> 'INSERT' then raise exception 'Metadados imutáveis' using errcode = '42501'; end if;
    new.created_at := statement_timestamp();
    new.expires_at := null; -- Só operações internas definem expiração.
  end if;
  return new;
end;
$$;
revoke all on function public.social_media_guard_link() from public;
create trigger social_media_guard_link before insert or update on public.message_media
for each row execute function public.social_media_guard_link();

-- Uma mensagem apagada não pode ser restaurada para expor anexos em retenção.
create or replace function public.social_message_delete_once()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at then
    raise exception 'Uma mensagem apagada não pode ser restaurada';
  end if;
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := statement_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.social_message_delete_once() from public;
create trigger social_message_delete_once before update of deleted_at on public.messages
for each row execute function public.social_message_delete_once();

-- Compensação autenticada: reserva um órfão, nunca apaga um objeto referenciado.
create or replace function public.social_abandon_upload(p_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.social_media_valid_key(p_key) or split_part(p_key, '/', 2) is distinct from auth.uid()::text
    or not exists (select 1 from public.conversations c where c.id::text = split_part(p_key, '/', 1)
      and public.is_conversation_participant(c.id)) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key, 5));
  if exists (select 1 from public.message_media where storage_provider = 'supabase' and storage_key = p_key) then
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

-- Dry run por omissão. Uma referência ativa protege sempre a chave partilhada.
-- Serviço interno apenas; batches limitados e revalidação após obter o lock.
create or replace function public.social_claim_media_cleanup(p_limit integer default 100, p_apply boolean default false)
returns table(storage_key text, reason text)
language plpgsql security definer set search_path = '' as $$
declare v_key text; v_reason text; v_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'Limite inválido'; end if;
  -- Retoma jobs deixados por um processo interrompido. Ordem distribui tentativas.
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
    order by o.created_at, o.name limit p_limit * 10
  loop
    if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 5)) then continue; end if;
    -- Nova consulta após o lock: não usar apenas o snapshot do cursor de candidatos.
    if exists (select 1 from public.social_media_cleanup_jobs j where j.storage_key = v_key) then continue; end if;
    if exists (
      select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
      where mm.storage_provider = 'supabase' and mm.storage_key = v_key
        and not ((m.deleted_at is not null and m.deleted_at < now() - interval '30 days')
          or (mm.expires_at is not null and mm.expires_at < now() - interval '24 hours')))
    then continue; end if;
    v_reason := case when exists (select 1 from public.message_media mm
      where mm.storage_provider = 'supabase' and mm.storage_key = v_key) then 'retention' else 'orphan' end;
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
commit;
