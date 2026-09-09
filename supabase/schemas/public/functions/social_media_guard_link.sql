create or replace function public.social_media_guard_link()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_provider = 'supabase' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.storage_key, 5));
    if public.social_media_is_claimed(new.storage_key) then
      raise exception 'Anexo em limpeza' using errcode = '42501';
    end if;
  end if;
  if auth.role() = 'authenticated' then
    if TG_OP <> 'INSERT' then raise exception 'Metadados imutáveis' using errcode = '42501'; end if;
    new.created_at := statement_timestamp();
    new.expires_at := null; -- Só operações internas definem expiração.
  end if;
  return new;
end;
$$;
revoke all on function public.social_media_guard_link() from public;
