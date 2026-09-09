-- Fase 4: aplicar apenas depois da Fase 3. Sem alterações aos marketplaces.
create or replace function public.social_message_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function public.social_message_activity() from public;
create trigger social_message_activity after insert on public.messages
for each row execute function public.social_message_activity();

-- O cliente só pode avançar a leitura até uma mensagem que efetivamente recebeu.
create or replace function public.social_mark_read(p_conversation uuid, p_message uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  if not public.is_conversation_participant(p_conversation) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  select created_at into v_at from public.messages
    where id = p_message and conversation_id = p_conversation;
  if v_at is null then raise exception 'Mensagem inválida'; end if;
  update public.conversation_participants
    set last_read_at = greatest(last_read_at, v_at)
    where conversation_id = p_conversation and user_id = auth.uid();
end;
$$;
revoke all on function public.social_mark_read(uuid, uuid) from public;
grant execute on function public.social_mark_read(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-message-media', 'social-message-media', false, 5242880,
  array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict (id) do nothing;

-- Chaves: conversation_id/user_id/uuid. Sem URLs públicas ou nomes fornecidos pelo cliente.
create policy "social media upload" on storage.objects for insert to authenticated
with check (bucket_id = 'social-message-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1] and c.type = 'direct'
      and public.is_conversation_participant(c.id)));
create policy "social media read" on storage.objects for select to authenticated
using (bucket_id = 'social-message-media' and exists (
  select 1 from public.message_media mm join public.messages m on m.id = mm.message_id
  where mm.storage_provider = 'supabase' and mm.storage_key = name
    and m.deleted_at is null and public.is_conversation_participant(m.conversation_id)));
-- Apenas uploads ainda não associados podem ser removidos numa compensação.
create policy "social media cleanup" on storage.objects for delete to authenticated
using (bucket_id = 'social-message-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and not exists (select 1 from public.message_media mm where mm.storage_key = name));

-- Permite a compensação de uploads órfãos pelo respetivo autor.
create policy "social media orphan read" on storage.objects for select to authenticated
using (bucket_id = 'social-message-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and not exists (select 1 from public.message_media mm where mm.storage_key = name));

create or replace function public.social_media_exists(p_key text, p_mime text, p_size bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select split_part(p_key, '/', 2) = auth.uid()::text and exists (
    select 1 from storage.objects o where o.bucket_id = 'social-message-media'
      and o.name = p_key and o.metadata->>'mimetype' = p_mime
      and (o.metadata->>'size')::bigint = p_size
  );
$$;
revoke all on function public.social_media_exists(text, text, bigint) from public;
grant execute on function public.social_media_exists(text, text, bigint) to authenticated;

-- Impede associar o ficheiro de outra pessoa ou conversa.
drop policy "Autor da mensagem associa media" on public.message_media;
create policy "Autor da mensagem associa media" on public.message_media
for insert to authenticated with check (
  storage_provider = 'supabase' and public.social_media_exists(storage_key, mime_type, size_bytes) and exists (
    select 1 from public.messages m where m.id = message_id
      and m.sender_id = auth.uid() and m.deleted_at is null
      and public.is_conversation_participant(m.conversation_id)
      and split_part(storage_key, '/', 1) = m.conversation_id::text
      and split_part(storage_key, '/', 2) = auth.uid()::text));

-- Mensagem e metadados do anexo são atómicos; executa com as permissões/RLS do utilizador.
create or replace function public.social_send_message(
  p_conversation uuid, p_content text, p_key text default null,
  p_mime text default null, p_size bigint default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.conversations
      where id = p_conversation and type = 'direct') then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  if length(coalesce(p_content, '')) > 5000
     or (length(btrim(coalesce(p_content, ''))) = 0 and p_key is null) then
    raise exception 'Mensagem inválida';
  end if;
  if p_key is not null and (p_mime is null or p_mime not in
    ('image/jpeg','image/png','image/webp','application/pdf','video/mp4')
    or p_size is null or p_size <= 0 or p_size > 5242880) then
    raise exception 'Anexo inválido';
  end if;
  insert into public.messages(conversation_id, sender_id, content, message_type)
  values (p_conversation, auth.uid(), nullif(btrim(p_content), ''),
    case when p_key is null then 'text' when p_mime like 'image/%' then 'image'
      when p_mime like 'video/%' then 'video' else 'file' end) returning id into v_id;
  if p_key is not null then
    insert into public.message_media(message_id, storage_key, mime_type, size_bytes)
    values (v_id, p_key, p_mime, p_size);
  end if;
  return v_id;
end;
$$;
revoke all on function public.social_send_message(uuid, text, text, text, bigint) from public;
grant execute on function public.social_send_message(uuid, text, text, text, bigint) to authenticated;
