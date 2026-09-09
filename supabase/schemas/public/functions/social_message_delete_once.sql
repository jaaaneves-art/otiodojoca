create or replace function public.social_message_delete_once()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at then
    raise exception 'Uma mensagem apagada não pode ser restaurada';
  end if;
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := statement_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.social_message_delete_once() from public;
