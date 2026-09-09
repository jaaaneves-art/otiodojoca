create or replace function public.social_message_events()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if not exists (select 1 from public.conversations where id = new.conversation_id and type = 'direct') then
    return new;
  end if;
  if TG_OP = 'INSERT' and new.deleted_at is null then
    insert into public.notifications(user_id, type, message, link, social_message_id, is_read)
    select cp.user_id, 'message', 'Recebeste uma mensagem privada.',
      '/mensagens/' || new.conversation_id::text, new.id,
      coalesce(cp.last_read_at >= new.created_at, false)
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
    on conflict (user_id, social_message_id) where social_message_id is not null do nothing;
  end if;
  -- Ordem fixa para reduzir deadlocks entre envios concorrentes do mesmo par.
  for v_user in select user_id from public.conversation_participants
    where conversation_id = new.conversation_id order by user_id
  loop perform public.social_notify_signal(v_user); end loop;
  return new;
end;
$$;
revoke all on function public.social_message_events() from public, anon, authenticated;
