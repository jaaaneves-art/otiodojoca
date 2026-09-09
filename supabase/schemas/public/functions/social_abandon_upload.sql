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
