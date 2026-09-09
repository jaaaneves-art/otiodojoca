-- Cria automaticamente a conversa de grupo quando um grupo é criado.
-- A app nunca cria esta conversa manualmente (secção 19/70 do prompt mestre).
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversations (type, group_id)
  values ('group', new.id);

  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do update set role = 'owner';

  return new;
end;
$$;

revoke all on function public.handle_new_group() from public;
grant execute on function public.handle_new_group() to postgres, service_role;
