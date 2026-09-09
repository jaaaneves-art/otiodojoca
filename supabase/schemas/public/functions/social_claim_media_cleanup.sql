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
