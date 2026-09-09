-- Fase 6. Aplicação manual futura, após Fases 3–5. Apenas módulo social.
begin;

-- Só sinais sem conteúdo/conversation_id são publicados. Cada sessão lê a sua linha.
create table public.social_realtime_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  revision bigint not null default 1
);
alter table public.social_realtime_state enable row level security;
revoke all on public.social_realtime_state from public, anon, authenticated;
grant select on public.social_realtime_state to authenticated;
grant all on public.social_realtime_state to service_role;
create policy "social realtime owner" on public.social_realtime_state
for select to authenticated using (user_id = auth.uid());

alter table public.notifications add column social_message_id uuid
  references public.messages(id) on delete cascade;
create unique index social_notification_once on public.notifications(user_id, social_message_id)
  where social_message_id is not null;
-- As policies existentes continuam a controlar as notificações dos outros módulos.
create policy "social notification visibility" on public.notifications as restrictive
for select to public using (social_message_id is null or exists (
  select 1 from public.messages m where m.id = social_message_id and m.deleted_at is null
    and public.is_conversation_participant(m.conversation_id)
));

create or replace function public.social_notify_signal(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.social_realtime_state(user_id, revision) values (p_user, 1)
  on conflict (user_id) do update set revision = public.social_realtime_state.revision + 1;
$$;
revoke all on function public.social_notify_signal(uuid) from public, anon, authenticated;
grant execute on function public.social_notify_signal(uuid) to service_role;

create or replace function public.social_message_events()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if not exists (select 1 from public.conversations where id = new.conversation_id and type = 'direct') then
    return new;
  end if;
  if TG_OP = 'INSERT' and new.deleted_at is null then
    insert into public.notifications(user_id, type, message, link, social_message_id, is_read)
    select cp.user_id, 'message', 'Recebeste uma mensagem privada.',
      '/mensagens/' || new.conversation_id::text, new.id,
      coalesce(cp.last_read_at >= new.created_at, false)
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
    on conflict (user_id, social_message_id) where social_message_id is not null do nothing;
  end if;
  -- Ordem fixa para reduzir deadlocks entre envios concorrentes do mesmo par.
  for v_user in select user_id from public.conversation_participants
    where conversation_id = new.conversation_id order by user_id
  loop perform public.social_notify_signal(v_user); end loop;
  return new;
end;
$$;
revoke all on function public.social_message_events() from public, anon, authenticated;
create trigger social_message_events after insert or update of deleted_at on public.messages
for each row execute function public.social_message_events();

create or replace function public.social_participant_events()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.conversations where id = coalesce(new.conversation_id, old.conversation_id) and type = 'direct')
    and exists (select 1 from public.profiles where id = coalesce(new.user_id, old.user_id)) then
    perform public.social_notify_signal(coalesce(new.user_id, old.user_id));
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.social_participant_events() from public, anon, authenticated;
create trigger social_participant_events after insert or update of last_read_at or delete
on public.conversation_participants for each row execute function public.social_participant_events();

-- A API já permite UPDATE de notificações próprias; os campos sociais são imutáveis.
create or replace function public.social_notification_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and (old.social_message_id is not null or new.social_message_id is not null)
    and (to_jsonb(new) - 'is_read') is distinct from (to_jsonb(old) - 'is_read') then
    raise exception 'Só é permitido alterar a leitura da notificação' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_guard() from public, anon, authenticated;
create trigger social_notification_guard before update on public.notifications
for each row execute function public.social_notification_guard();

create or replace function public.social_notification_read_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.social_message_id is not null and new.is_read is distinct from old.is_read then
    perform public.social_notify_signal(new.user_id);
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_read_event() from public, anon, authenticated;
create trigger social_notification_read_event after update of is_read on public.notifications
for each row execute function public.social_notification_read_event();

create or replace function public.social_mark_read(p_conversation uuid, p_message uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  if not public.is_conversation_participant(p_conversation) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  select created_at into v_at from public.messages where id = p_message and conversation_id = p_conversation;
  if v_at is null then raise exception 'Mensagem inválida'; end if;
  -- Sem UPDATE quando não há avanço: evita ciclos evento -> refresh -> leitura.
  update public.conversation_participants set last_read_at = v_at
    where conversation_id = p_conversation and user_id = auth.uid()
      and (last_read_at is null or last_read_at < v_at);
  update public.notifications n set is_read = true
    from public.messages m where m.id = n.social_message_id
      and m.conversation_id = p_conversation and m.created_at <= v_at
      and n.user_id = auth.uid() and n.is_read is distinct from true;
end;
$$;
revoke all on function public.social_mark_read(uuid, uuid) from public;
grant execute on function public.social_mark_read(uuid, uuid) to authenticated;

-- Publicação aditiva e idempotente; não altera tabelas já publicadas nem REPLICA IDENTITY.
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'social_realtime_state') then
    alter publication supabase_realtime add table public.social_realtime_state;
  end if;
end $$;
commit;
