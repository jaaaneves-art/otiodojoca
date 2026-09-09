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
