create or replace function public.social_message_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function public.social_message_activity() from public;
