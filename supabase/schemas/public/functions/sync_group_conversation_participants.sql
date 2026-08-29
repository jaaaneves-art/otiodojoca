-- Secção 70 do prompt mestre: group_members é a fonte única de verdade.
-- conversation_participants da conversa do grupo é sincronizado A PARTIR
-- DAQUI, nunca ao contrário, e nunca escrito manualmente pela app para
-- conversas de grupo.
create or replace function public.sync_group_conversation_participants()
returns trigger
language plpgsql
security definer
as $$
declare
  v_conversation_id uuid;
begin
  select id into v_conversation_id
  from public.conversations
  where group_id = coalesce(new.group_id, old.group_id)
    and type = 'group';

  if v_conversation_id is null then
    return coalesce(new, old);
  end if;

  if TG_OP = 'INSERT' then
    insert into public.conversation_participants (conversation_id, user_id, role)
    values (v_conversation_id, new.user_id, new.role)
    on conflict (conversation_id, user_id) do update set role = excluded.role;
  elsif TG_OP = 'UPDATE' then
    update public.conversation_participants
    set role = new.role
    where conversation_id = v_conversation_id and user_id = new.user_id;
  elsif TG_OP = 'DELETE' then
    delete from public.conversation_participants
    where conversation_id = v_conversation_id and user_id = old.user_id;
  end if;

  return coalesce(new, old);
end;
$$;
