create or replace function public.social_media_is_claimed(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.social_media_cleanup_jobs where storage_key = p_key);
$$;
revoke all on function public.social_media_is_claimed(text) from public;
grant execute on function public.social_media_is_claimed(text) to authenticated, service_role;
