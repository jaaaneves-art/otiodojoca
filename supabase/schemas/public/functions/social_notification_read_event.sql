create or replace function public.social_notification_read_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.social_message_id is not null and new.is_read is distinct from old.is_read then
    perform public.social_notify_signal(new.user_id);
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_read_event() from public, anon, authenticated;
