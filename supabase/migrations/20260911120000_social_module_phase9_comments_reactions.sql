-- Fase 9: comentarios e reacoes no feed. Aplicar depois da Fase 8.
begin;

alter table public.social_posts
  add column comments_count integer not null default 0 check (comments_count >= 0),
  add column reactions_count integer not null default 0 check (reactions_count >= 0),
  add column likes_count integer not null default 0 check (likes_count >= 0),
  add column loves_count integer not null default 0 check (loves_count >= 0),
  add column useful_count integer not null default 0 check (useful_count >= 0);

create table public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.social_post_comments enable row level security;
create index social_post_comments_post on public.social_post_comments(post_id, created_at desc, id desc)
  where deleted_at is null;
create index social_post_comments_author on public.social_post_comments(author_id, created_at desc);
create policy "Membros veem comentarios ativos" on public.social_post_comments
for select to authenticated using (
  deleted_at is null and exists (
    select 1 from public.social_posts p
    where p.id = post_id and p.deleted_at is null and p.visibility = 'public'
  )
);
revoke all on public.social_post_comments from public, anon, authenticated;
grant select on public.social_post_comments to authenticated;
grant all on public.social_post_comments to service_role;

create table public.social_post_reactions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','love','useful')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.social_post_reactions enable row level security;
create index social_post_reactions_user on public.social_post_reactions(user_id, created_at desc);
create policy "Membros veem reacoes de publicacoes ativas" on public.social_post_reactions
for select to authenticated using (
  exists (select 1 from public.social_posts p
    where p.id = post_id and p.deleted_at is null and p.visibility = 'public')
);
revoke all on public.social_post_reactions from public, anon, authenticated;
grant select on public.social_post_reactions to authenticated;
grant all on public.social_post_reactions to service_role;

alter table public.notifications
  add column social_comment_id uuid references public.social_post_comments(id) on delete cascade,
  add column social_reaction_post_id uuid references public.social_posts(id) on delete cascade,
  add column social_reaction_actor_id uuid references public.profiles(id) on delete cascade;
create unique index social_comment_notification_once
  on public.notifications(user_id, social_comment_id) where social_comment_id is not null;
create unique index social_reaction_notification_once
  on public.notifications(user_id, social_reaction_post_id, social_reaction_actor_id)
  where social_reaction_post_id is not null and social_reaction_actor_id is not null;

create or replace function public.social_create_comment(p_post uuid, p_content text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_content text := btrim(coalesce(p_content, ''));
  v_owner uuid;
  v_id uuid;
  v_actor text;
begin
  if v_user is null then raise exception 'Autenticacao necessaria' using errcode = '42501'; end if;
  if char_length(v_content) not between 1 and 1000 then
    raise exception 'Comentario invalido' using errcode = '22023';
  end if;
  select author_id into v_owner from public.social_posts
  where id = p_post and deleted_at is null and visibility = 'public' for update;
  if v_owner is null then raise exception 'Publicacao indisponivel' using errcode = '22023'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 9));
  select id into v_id from public.social_post_comments
  where post_id = p_post and author_id = v_user and content = v_content and deleted_at is null
    and created_at > statement_timestamp() - interval '1 minute'
  order by created_at desc, id desc limit 1;
  if v_id is not null then return v_id; end if;
  if (select count(*) from public.social_post_comments
      where author_id = v_user and created_at > statement_timestamp() - interval '1 hour') >= 60 then
    raise exception 'Limite temporario de comentarios atingido' using errcode = '54000';
  end if;

  insert into public.social_post_comments(post_id, author_id, content)
  values (p_post, v_user, v_content) returning id into v_id;
  update public.social_posts set comments_count = comments_count + 1, updated_at = statement_timestamp()
  where id = p_post;

  if v_owner <> v_user then
    select coalesce(nullif(btrim(display_name), ''), '@' || username, 'Alguem') into v_actor
    from public.profiles where id = v_user;
    insert into public.notifications(user_id, type, message, link, is_read, social_comment_id)
    values (v_owner, 'reply', v_actor || ' comentou a tua publicacao.',
      '/comunidade/feed/' || p_post::text || '#comentarios', false, v_id)
    on conflict (user_id, social_comment_id) where social_comment_id is not null do nothing;
    perform public.social_notify_signal(v_owner);
  end if;
  return v_id;
end;
$$;
revoke all on function public.social_create_comment(uuid, text) from public, anon;
grant execute on function public.social_create_comment(uuid, text) to authenticated;

create or replace function public.social_delete_comment(p_comment uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_post uuid; v_owner uuid;
begin
  select c.post_id, p.author_id into v_post, v_owner
  from public.social_post_comments c join public.social_posts p on p.id = c.post_id
  where c.id = p_comment and c.author_id = auth.uid() and c.deleted_at is null for update of c, p;
  if v_post is null then return false; end if;
  update public.social_post_comments set deleted_at = statement_timestamp(), updated_at = statement_timestamp()
  where id = p_comment;
  update public.social_posts set comments_count = greatest(0, comments_count - 1), updated_at = statement_timestamp()
  where id = v_post;
  delete from public.notifications where social_comment_id = p_comment;
  if v_owner <> auth.uid() then perform public.social_notify_signal(v_owner); end if;
  return true;
end;
$$;
revoke all on function public.social_delete_comment(uuid) from public, anon;
grant execute on function public.social_delete_comment(uuid) to authenticated;

create or replace function public.social_toggle_reaction(p_post uuid, p_reaction text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_old text;
  v_new text;
  v_actor text;
  v_verb text;
begin
  if v_user is null then raise exception 'Autenticacao necessaria' using errcode = '42501'; end if;
  if p_reaction is null or p_reaction not in ('like','love','useful') then
    raise exception 'Reacao invalida' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_post::text || ':' || v_user::text, 10));
  select author_id into v_owner from public.social_posts
  where id = p_post and deleted_at is null and visibility = 'public' for update;
  if v_owner is null then raise exception 'Publicacao indisponivel' using errcode = '22023'; end if;
  select reaction into v_old from public.social_post_reactions
  where post_id = p_post and user_id = v_user for update;
  v_new := case when v_old = p_reaction then null else p_reaction end;

  if v_old is null then
    insert into public.social_post_reactions(post_id, user_id, reaction)
    values (p_post, v_user, v_new);
  elsif v_new is null then
    delete from public.social_post_reactions where post_id = p_post and user_id = v_user;
  else
    update public.social_post_reactions set reaction = v_new, updated_at = statement_timestamp()
    where post_id = p_post and user_id = v_user;
  end if;

  update public.social_posts set
    reactions_count = greatest(0, reactions_count
      + case when v_new is not null then 1 else 0 end
      - case when v_old is not null then 1 else 0 end),
    likes_count = greatest(0, likes_count
      + case when v_new = 'like' then 1 else 0 end
      - case when v_old = 'like' then 1 else 0 end),
    loves_count = greatest(0, loves_count
      + case when v_new = 'love' then 1 else 0 end
      - case when v_old = 'love' then 1 else 0 end),
    useful_count = greatest(0, useful_count
      + case when v_new = 'useful' then 1 else 0 end
      - case when v_old = 'useful' then 1 else 0 end),
    updated_at = statement_timestamp()
  where id = p_post;

  if v_owner <> v_user then
    if v_new is null then
      delete from public.notifications where user_id = v_owner
        and social_reaction_post_id = p_post and social_reaction_actor_id = v_user;
    else
      select coalesce(nullif(btrim(display_name), ''), '@' || username, 'Alguem') into v_actor
      from public.profiles where id = v_user;
      v_verb := case v_new when 'like' then 'gostou da tua publicacao.'
        when 'love' then 'adorou a tua publicacao.' else 'marcou a tua publicacao como util.' end;
      insert into public.notifications(user_id, type, message, link, is_read,
        social_reaction_post_id, social_reaction_actor_id)
      values (v_owner, 'like', v_actor || ' ' || v_verb,
        '/comunidade/feed/' || p_post::text, false, p_post, v_user)
      on conflict (user_id, social_reaction_post_id, social_reaction_actor_id)
        where social_reaction_post_id is not null and social_reaction_actor_id is not null
      do update set message = excluded.message, link = excluded.link, is_read = false,
        created_at = statement_timestamp();
    end if;
    perform public.social_notify_signal(v_owner);
  end if;
  return v_new;
end;
$$;
revoke all on function public.social_toggle_reaction(uuid, text) from public, anon;
grant execute on function public.social_toggle_reaction(uuid, text) to authenticated;

drop policy "social notification visibility" on public.notifications;
create policy "social notification visibility" on public.notifications as restrictive
for select to public using (
  (social_message_id is null or exists (
    select 1 from public.messages m where m.id = social_message_id and m.deleted_at is null
      and public.is_conversation_participant(m.conversation_id)))
  and (social_comment_id is null or exists (
    select 1 from public.social_post_comments c join public.social_posts p on p.id = c.post_id
    where c.id = social_comment_id and c.deleted_at is null and p.deleted_at is null))
  and (social_reaction_post_id is null or exists (
    select 1 from public.social_post_reactions r join public.social_posts p on p.id = r.post_id
    where r.post_id = social_reaction_post_id and r.user_id = social_reaction_actor_id
      and p.deleted_at is null))
);

create or replace function public.social_notification_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated'
    and (to_jsonb(new) - 'is_read') is distinct from (to_jsonb(old) - 'is_read') then
    raise exception 'So e permitido alterar a leitura da notificacao' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_guard() from public, anon, authenticated;

create or replace function public.social_notification_read_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_read is distinct from old.is_read and (
    new.social_message_id is not null or new.social_group_invite_id is not null
    or new.social_comment_id is not null or new.social_reaction_post_id is not null
  ) then
    perform public.social_notify_signal(new.user_id);
  end if;
  return new;
end;
$$;
revoke all on function public.social_notification_read_event() from public, anon, authenticated;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

commit;
