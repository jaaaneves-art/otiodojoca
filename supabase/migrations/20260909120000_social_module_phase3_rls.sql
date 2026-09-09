-- OTJ - Modulo social - Fase 3: endurecimento e testes RLS
-- Migration aditiva. Nao altera dados nem remove tabelas.

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

-- Evita auto-referencia recursiva nas policies de group_members.
create or replace function public.is_group_manager(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_group_manager(uuid) from public;
grant execute on function public.is_group_manager(uuid) to authenticated, service_role;

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

  -- Uma sessao comum so pode criar uma conversa da qual faz parte.
  -- service_role continua disponivel para operacoes internas autorizadas.
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
    select id into v_id
    from public.conversations
    where type = 'direct'
      and direct_user_a = v_lo
      and direct_user_b = v_hi;
  else
    insert into public.conversation_participants (conversation_id, user_id)
    values (v_id, v_lo), (v_id, v_hi);
  end if;

  return v_id;
end;
$$;

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversations (type, group_id)
  values ('group', new.id);

  -- O criador fica membro owner na mesma transacao. Sem isto, a RLS
  -- impede-o de ler o grupo acabado de criar ate a uma segunda escrita.
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do update set role = 'owner';

  return new;
end;
$$;

revoke all on function public.handle_new_group() from public;
grant execute on function public.handle_new_group() to postgres, service_role;

create or replace function public.sync_group_conversation_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
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

revoke all on function public.sync_group_conversation_participants() from public;
grant execute on function public.sync_group_conversation_participants() to postgres, service_role;

drop policy if exists "Utilizador autenticado cria grupo (torna-se owner)" on public.groups;
create policy "Utilizador autenticado cria grupo (torna-se owner)" on public.groups
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Owner/admin atualiza os dados do grupo" on public.groups;
create policy "Owner/admin atualiza os dados do grupo" on public.groups
  for update to authenticated
  using (public.is_group_manager(id))
  with check (public.is_group_manager(id));

-- O owner_id e a identidade do grupo sao imutaveis pela API. A gestao
-- corrente limita-se aos campos editoriais.
revoke update on public.groups from authenticated;
grant update (name, description, image_url) on public.groups to authenticated;

drop policy if exists "Owner/admin adiciona membros" on public.group_members;
create policy "Owner/admin adiciona membros" on public.group_members
  for insert to authenticated
  with check (
    public.is_group_manager(group_id)
    and role in ('admin', 'moderator', 'member')
  );

create policy "Owner/admin altera membros" on public.group_members
  for update to authenticated
  using (
    public.is_group_manager(group_id)
    and role <> 'owner'
  )
  with check (
    public.is_group_manager(group_id)
    and role in ('admin', 'moderator', 'member')
  );

create policy "Owner/admin remove membros" on public.group_members
  for delete to authenticated
  using (
    public.is_group_manager(group_id)
    and role <> 'owner'
  );

grant update (role), delete on public.group_members to authenticated;

-- A unica alteracao permitida ao autor e marcar deleted_at.
drop policy if exists "Autor apaga (soft delete) a sua mensagem" on public.messages;
create policy "Autor apaga (soft delete) a sua mensagem" on public.messages
  for update to authenticated
  using (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  )
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

revoke update on public.messages from authenticated;
grant update (deleted_at) on public.messages to authenticated;

drop policy if exists "Utilizador regista a sua propria entrada/saida" on public.call_participants;
create policy "Utilizador regista a sua propria entrada/saida" on public.call_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and call_room_id in (
      select cr.id
      from public.call_rooms cr
      where public.is_conversation_participant(cr.conversation_id)
    )
  );

create policy "Utilizador regista a sua propria saida" on public.call_participants
  for update to authenticated
  using (
    user_id = auth.uid()
    and call_room_id in (
      select cr.id
      from public.call_rooms cr
      where public.is_conversation_participant(cr.conversation_id)
    )
  )
  with check (
    user_id = auth.uid()
    and call_room_id in (
      select cr.id
      from public.call_rooms cr
      where public.is_conversation_participant(cr.conversation_id)
    )
  );

grant update (left_at) on public.call_participants to authenticated;
