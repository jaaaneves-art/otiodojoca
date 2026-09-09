create or replace function public.social_mark_read(p_conversation uuid, p_message uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  if not public.is_conversation_participant(p_conversation) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  select created_at into v_at from public.messages
    where id = p_message and conversation_id = p_conversation;
  if v_at is null then raise exception 'Mensagem inválida'; end if;
  update public.conversation_participants
    set last_read_at = greatest(last_read_at, v_at)
    where conversation_id = p_conversation and user_id = auth.uid();
end;
$$;
revoke all on function public.social_mark_read(uuid, uuid) from public;
grant execute on function public.social_mark_read(uuid, uuid) to authenticated;
