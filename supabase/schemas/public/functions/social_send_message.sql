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
