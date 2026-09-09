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
