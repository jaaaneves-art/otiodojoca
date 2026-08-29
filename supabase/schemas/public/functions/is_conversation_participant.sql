-- Função security definer para evitar subqueries auto-referenciadas nas
-- policies de conversation_participants/messages/message_media/call_rooms
-- (o mesmo padrão standard usado em apps de chat sobre Postgres RLS).
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to "authenticated", "service_role";
