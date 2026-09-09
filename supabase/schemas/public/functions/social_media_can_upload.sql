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
