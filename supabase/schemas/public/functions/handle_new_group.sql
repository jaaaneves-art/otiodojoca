-- Cria automaticamente a conversa de grupo quando um grupo é criado.
-- A app nunca cria esta conversa manualmente (secção 19/70 do prompt mestre).
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.conversations (type, group_id)
  values ('group', new.id);
  return new;
end;
$$;
