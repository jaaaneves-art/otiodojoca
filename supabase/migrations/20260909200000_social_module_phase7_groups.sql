-- Fase 7: grupos sociais. Aplicar apenas depois das fases 3-6.
begin;

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','moderator','member')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
alter table public.group_invites enable row level security;
create index group_invites_invitee on public.group_invites(invitee_id, status, created_at desc);
create index group_invites_group on public.group_invites(group_id, status, created_at desc);
create unique index group_invites_one_pending on public.group_invites(group_id, invitee_id)
  where status = 'pending';

alter table public.notifications add column social_group_invite_id uuid
  references public.group_invites(id) on delete cascade;
create unique index social_group_notification_once on public.notifications(user_id, social_group_invite_id)
  where social_group_invite_id is not null;

create policy "group invites visible to participants" on public.group_invites
for select to authenticated using (invitee_id = auth.uid() or public.is_group_member(group_id));
create policy "group invites recipient responds" on public.group_invites
for update to authenticated using (invitee_id = auth.uid() and status = 'pending')
with check (invitee_id = auth.uid() and status in ('accepted','declined'));
grant select, update on public.group_invites to authenticated;
grant all on public.group_invites to service_role;
revoke all on public.group_invites from anon;

create or replace function public.social_create_group(p_name text, p_description text default null, p_image_url text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or length(btrim(coalesce(p_name,''))) not between 1 and 120 then
    raise exception 'Nome de grupo inválido' using errcode = '22023';
  end if;
  insert into public.groups(name, description, image_url, owner_id)
  values (btrim(p_name), nullif(btrim(p_description),''), nullif(btrim(p_image_url),''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.social_create_group(text,text,text) from public;
grant execute on function public.social_create_group(text,text,text) to authenticated;

create or replace function public.social_invite_to_group(p_group uuid, p_invitee uuid, p_role text default 'member')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_inviter uuid := auth.uid(); v_group_name text;
begin
  if not public.is_group_manager(p_group) or p_invitee is null or p_invitee = v_inviter
    or p_role not in ('admin','moderator','member') then raise exception 'Sem permissão' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_invitee and deleted_at is null) then raise exception 'Utilizador inválido'; end if;
  if exists (select 1 from public.group_members where group_id = p_group and user_id = p_invitee) then raise exception 'Já é membro'; end if;
  insert into public.group_invites(group_id, invitee_id, inviter_id, role)
  values (p_group,p_invitee,v_inviter,p_role)
  on conflict (group_id, invitee_id) where status = 'pending' do update set inviter_id = excluded.inviter_id, role = excluded.role, created_at = now()
  returning id into v_id;
  select name into v_group_name from public.groups where id = p_group;
  insert into public.notifications(user_id,type,message,link,is_read,social_group_invite_id)
  select p_invitee,'group_invite','Foste convidado para o grupo ' || v_group_name,
    '/grupos/' || p_group::text,false,v_id
  on conflict (user_id, social_group_invite_id) where social_group_invite_id is not null do nothing;
  perform public.social_notify_signal(p_invitee);
  return v_id;
end;
$$;
revoke all on function public.social_invite_to_group(uuid,uuid,text) from public;
grant execute on function public.social_invite_to_group(uuid,uuid,text) to authenticated;

create or replace function public.social_respond_group_invite(p_invite uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_inv public.group_invites%rowtype; v_conversation uuid;
begin
  select * into v_inv from public.group_invites where id=p_invite and invitee_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'Convite indisponível' using errcode = '42501'; end if;
  update public.group_invites set status=case when p_accept then 'accepted' else 'declined' end, responded_at=now() where id=p_invite;
  if p_accept then
    insert into public.group_members(group_id,user_id,role) values(v_inv.group_id,auth.uid(),v_inv.role)
      on conflict (group_id,user_id) do update set role=excluded.role;
    select id into v_conversation from public.conversations where group_id=v_inv.group_id and type='group';
    perform public.social_notify_signal(auth.uid());
    return v_conversation;
  end if;
  perform public.social_notify_signal(auth.uid());
  return null;
end;
$$;
revoke all on function public.social_respond_group_invite(uuid,boolean) from public;
grant execute on function public.social_respond_group_invite(uuid,boolean) to authenticated;

create or replace function public.social_leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.groups where id=p_group for update;
  if v_owner is null or v_owner=auth.uid() then raise exception 'O owner tem de transferir a propriedade primeiro' using errcode='42501'; end if;
  delete from public.group_members where group_id=p_group and user_id=auth.uid();
end;
$$;
revoke all on function public.social_leave_group(uuid) from public;
grant execute on function public.social_leave_group(uuid) to authenticated;

create or replace function public.social_transfer_group_owner(p_group uuid, p_new_owner uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.groups where id=p_group and owner_id=auth.uid()) then raise exception 'Só o owner pode transferir' using errcode='42501'; end if;
  if not exists (select 1 from public.group_members where group_id=p_group and user_id=p_new_owner) then raise exception 'O novo owner tem de ser membro' using errcode='22023'; end if;
  update public.groups set owner_id=p_new_owner where id=p_group;
  update public.group_members set role='member' where group_id=p_group and user_id=auth.uid();
  update public.group_members set role='owner' where group_id=p_group and user_id=p_new_owner;
end;
$$;
revoke all on function public.social_transfer_group_owner(uuid,uuid) from public;
grant execute on function public.social_transfer_group_owner(uuid,uuid) to authenticated;

create or replace function public.social_manage_group_member(p_group uuid, p_user uuid, p_action text, p_role text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_group_manager(p_group) then raise exception 'Sem permissão' using errcode='42501'; end if;
  if p_action='remove' then
    if exists (select 1 from public.groups where id=p_group and owner_id=p_user) then raise exception 'Não é possível remover o owner'; end if;
    delete from public.group_members where group_id=p_group and user_id=p_user;
  elsif p_action='role' and p_role in ('admin','moderator','member') then
    update public.group_members set role=p_role where group_id=p_group and user_id=p_user and role <> 'owner';
  else raise exception 'Operação inválida' using errcode='22023'; end if;
end;
$$;
revoke all on function public.social_manage_group_member(uuid,uuid,text,text) from public;
grant execute on function public.social_manage_group_member(uuid,uuid,text,text) to authenticated;

-- A notificação de convite é privada e só pode ser lida pelo destinatário.
create policy "group invite notifications" on public.notifications as restrictive
for select to public using (type <> 'group_invite' or (auth.uid() = user_id and link like '/grupos/%'));

-- A RPC de mensagens das Fases 4-6 passa a aceitar a conversa de grupo,
-- mantendo o mesmo controlo RLS de participação e soft delete.
create or replace function public.social_send_message(
  p_conversation uuid, p_content text, p_key text default null,
  p_mime text default null, p_size bigint default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.conversations
      where id = p_conversation and type in ('direct','group'))
    or not public.is_conversation_participant(p_conversation) then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  if length(coalesce(p_content, '')) > 5000
     or (length(btrim(coalesce(p_content, ''))) = 0 and p_key is null) then raise exception 'Mensagem inválida'; end if;
  if p_key is not null and (p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','video/mp4')
      or p_size is null or p_size <= 0 or p_size > 5242880) then raise exception 'Anexo inválido'; end if;
  insert into public.messages(conversation_id,sender_id,content,message_type)
  values(p_conversation,auth.uid(),nullif(btrim(p_content),''),case when p_key is null then 'text' when p_mime like 'image/%' then 'image' when p_mime like 'video/%' then 'video' else 'file' end)
  returning id into v_id;
  if p_key is not null then insert into public.message_media(message_id,storage_key,mime_type,size_bytes) values(v_id,p_key,p_mime,p_size); end if;
  return v_id;
end;
$$;
revoke all on function public.social_send_message(uuid,text,text,text,bigint) from public;
grant execute on function public.social_send_message(uuid,text,text,text,bigint) to authenticated;

commit;
