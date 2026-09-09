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
