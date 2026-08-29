-- Secção 69 do prompt mestre: TODA a criação de conversa 1:1 passa por
-- esta função. É proibido INSERT direto em conversations(type='direct')
-- fora daqui. A unicidade é garantida pelo índice único
-- idx_conversations_direct_pair (least/greatest), não só pela lógica
-- desta função -- por isso é seguro sob pedidos concorrentes.
create or replace function public.get_or_create_direct_conversation(
  user_a uuid,
  user_b uuid,
  p_module text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_lo uuid := least(user_a, user_b);
  v_hi uuid := greatest(user_a, user_b);
begin
  insert into public.conversations (type, module, direct_user_a, direct_user_b)
  values ('direct', p_module, v_lo, v_hi)
  on conflict (direct_user_a, direct_user_b) where (type = 'direct')
  do nothing
  returning id into v_id;

  if v_id is null then
    -- já existia -- outro pedido concorrente ganhou a corrida, ou a
    -- conversa já foi criada antes.
    select id into v_id
    from public.conversations
    where type = 'direct' and direct_user_a = v_lo and direct_user_b = v_hi;
  else
    insert into public.conversation_participants (conversation_id, user_id)
    values (v_id, v_lo), (v_id, v_hi);
  end if;

  return v_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid, uuid, text) from public;
grant execute on function public.get_or_create_direct_conversation(uuid, uuid, text) to "authenticated", "service_role";
