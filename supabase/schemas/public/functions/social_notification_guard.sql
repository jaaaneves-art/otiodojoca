create or replace function public.social_notification_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and (old.social_message_id is not null or new.social_message_id is not null)
    and (to_jsonb(new) - 'is_read') is distinct from (to_jsonb(old) - 'is_read') then
    raise exception 'Só é permitido alterar a leitura da notificação' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_guard() from public, anon, authenticated;
