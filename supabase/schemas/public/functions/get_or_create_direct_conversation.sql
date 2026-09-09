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
set search_path = ''
as $$
declare
  v_id uuid;
  v_lo uuid;
  v_hi uuid;
begin
  if user_a is null or user_b is null or user_a = user_b then
    raise exception 'Uma conversa direta exige dois utilizadores diferentes'
      using errcode = '22023';
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and (auth.uid() is null or auth.uid() not in (user_a, user_b)) then
    raise exception 'Sem permissao para criar esta conversa'
      using errcode = '42501';
  end if;

  v_lo := least(user_a, user_b);
  v_hi := greatest(user_a, user_b);

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
