create or replace function public.social_participant_events()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.conversations where id = coalesce(new.conversation_id, old.conversation_id) and type = 'direct')
    and exists (select 1 from public.profiles where id = coalesce(new.user_id, old.user_id)) then
    perform public.social_notify_signal(coalesce(new.user_id, old.user_id));
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.social_participant_events() from public, anon, authenticated;
