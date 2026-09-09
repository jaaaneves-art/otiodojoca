create or replace function public.social_media_valid_key(p_key text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false);
$$;
revoke all on function public.social_media_valid_key(text) from public;
grant execute on function public.social_media_valid_key(text) to authenticated, service_role;
