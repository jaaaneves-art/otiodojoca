-- ============================================================
-- OTJ - MÓDULO SOCIAL - FASE 2 (v1)
-- ============================================================
-- Migration escrita manualmente (não gerada por `supabase db diff`),
-- porque o `db diff` deste projeto ainda não está corretamente
-- configurado para o fluxo declarativo (supabase/config.toml tem
-- `schema_paths = []`, por isso o diff comparou contra um estado
-- "vazio" e propôs apagar toda a base de dados — não foi aplicado
-- nada, ficou registado como pendente separado a corrigir com calma).
--
-- Esta migration é puramente aditiva: cria as tabelas/funções/
-- triggers do módulo social (Fase 1/2) e alarga o CHECK de
-- notifications.type. Nada é apagado ou alterado destrutivamente.
--
-- Conteúdo idêntico ao já escrito em supabase/schemas/public/tables/
-- e supabase/schemas/public/functions/ (commit "checkpoint antes de
-- reorganizar migrations" e o commit seguinte), apenas reordenado
-- para respeitar as dependências reais de criação em Postgres:
-- tabelas simples primeiro, depois as funções "security definer"
-- que as tabelas RLS precisam, e só depois as policies/triggers que
-- chamam essas funções (groups <-> group_members <-> is_group_member
-- formam uma dependência circular se não se fizer nesta ordem).
-- ============================================================


-- ------------------------------------------------------------
-- 1) TABELAS (sem RLS/policies/triggers ainda)
-- ------------------------------------------------------------

create table "public"."groups" (
  "id"          uuid                     not null default gen_random_uuid(),
  "name"        text                     not null,
  "description" text,
  "image_url"   text,
  "owner_id"    uuid                     not null,
  "created_at"  timestamp with time zone not null default now(),
  constraint "groups_pkey" primary key (id),
  constraint "groups_owner_id_fkey" foreign key (owner_id) references public.profiles(id) on delete cascade
);

alter table "public"."groups"
  enable row level security;

-- Fonte única de verdade para membros de grupo (secção 70 do prompt
-- mestre). conversation_participants da conversa do grupo é sincronizado
-- a partir DESTA tabela por trigger -- nunca ao contrário.
create table "public"."group_members" (
  "group_id"  uuid                     not null,
  "user_id"   uuid                     not null,
  "role"      text                     not null default 'member',
  "joined_at" timestamp with time zone not null default now(),
  constraint "group_members_pkey" primary key (group_id, user_id),
  constraint "group_members_group_id_fkey" foreign key (group_id) references public.groups(id) on delete cascade,
  constraint "group_members_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint "group_members_role_check"
    check (role = any (array['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text]))
);

alter table "public"."group_members"
  enable row level security;

create index idx_group_members_user
  on public.group_members using btree (user_id);

create table "public"."conversations" (
  "id"             uuid                     not null default gen_random_uuid(),
  "type"           text                     not null default 'direct',
  "module"         text,
  "group_id"       uuid,
  -- direct_user_a/direct_user_b só são preenchidos quando type='direct';
  -- normalizados com least/greatest para permitir o índice único abaixo
  -- (mesmo padrão já validado em marketplace_conversations.idx_conversations_par_direto).
  "direct_user_a"  uuid,
  "direct_user_b"  uuid,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  constraint "conversations_pkey" primary key (id),
  constraint "conversations_type_check" check (type = any (array['direct'::text, 'group'::text])),
  constraint "conversations_group_id_fkey" foreign key (group_id) references public.groups(id) on delete cascade
);

alter table "public"."conversations"
  enable row level security;

create index idx_conversations_group on public.conversations using btree (group_id)
  where group_id is not null;

-- Um par de utilizadores só pode ter UMA conversa direta entre si.
create unique index idx_conversations_direct_pair
  on public.conversations (direct_user_a, direct_user_b)
  where type = 'direct';

create table "public"."conversation_participants" (
  "conversation_id" uuid                     not null,
  "user_id"          uuid                     not null,
  -- "role" só é relevante para conversas de grupo; em conversas diretas
  -- fica sempre 'member'.
  "role"             text                     not null default 'member',
  "joined_at"        timestamp with time zone not null default now(),
  "last_read_at"     timestamp with time zone,
  constraint "conversation_participants_pkey" primary key (conversation_id, user_id),
  constraint "conversation_participants_conversation_id_fkey"
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint "conversation_participants_user_id_fkey"
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint "conversation_participants_role_check"
    check (role = any (array['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text]))
);

alter table "public"."conversation_participants"
  enable row level security;

create index idx_conversation_participants_user
  on public.conversation_participants using btree (user_id);

create table "public"."messages" (
  "id"              uuid                     not null default gen_random_uuid(),
  "conversation_id" uuid                     not null,
  "sender_id"       uuid                     not null,
  "content"         text,
  "message_type"    text                     not null default 'text',
  "created_at"      timestamp with time zone not null default now(),
  "deleted_at"      timestamp with time zone,
  constraint "messages_pkey" primary key (id),
  constraint "messages_conversation_id_fkey"
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint "messages_sender_id_fkey"
    foreign key (sender_id) references public.profiles(id) on delete cascade,
  constraint "messages_message_type_check"
    check (message_type = any (array['text'::text, 'image'::text, 'video'::text, 'file'::text, 'system'::text]))
);

alter table "public"."messages"
  enable row level security;

-- Nome distinto de "idx_messages_conversation" porque esse nome já
-- existe em produção (índice de marketplace_messages) -- nomes de
-- índice são únicos por schema em Postgres, não por tabela.
create index idx_social_messages_conversation
  on public.messages using btree (conversation_id, created_at desc);

create table "public"."message_media" (
  "id"               uuid                     not null default gen_random_uuid(),
  "message_id"       uuid                     not null,
  "storage_provider" text                     not null default 'supabase',
  "storage_key"      text                     not null,
  "mime_type"        text                     not null,
  "size_bytes"       bigint,
  "duration_seconds" integer,
  "width"            integer,
  "height"           integer,
  "thumbnail_path"   text,
  "created_at"       timestamp with time zone not null default now(),
  -- Data prevista de eliminação segundo a política de retenção (secção 17)
  -- -- por definir; nullable até essa política ficar decidida.
  "expires_at"       timestamp with time zone,
  constraint "message_media_pkey" primary key (id),
  constraint "message_media_message_id_fkey"
    foreign key (message_id) references public.messages(id) on delete cascade
);

alter table "public"."message_media"
  enable row level security;

create index idx_message_media_message
  on public.message_media using btree (message_id);

create table "public"."call_rooms" (
  "id"                uuid                     not null default gen_random_uuid(),
  "conversation_id"   uuid                     not null,
  "livekit_room_name" text                     not null,
  "started_by"        uuid                     not null,
  "started_at"        timestamp with time zone not null default now(),
  "ended_at"          timestamp with time zone,
  constraint "call_rooms_pkey" primary key (id),
  constraint "call_rooms_conversation_id_fkey"
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint "call_rooms_started_by_fkey"
    foreign key (started_by) references public.profiles(id) on delete cascade,
  constraint "call_rooms_livekit_room_name_key" unique (livekit_room_name)
);

alter table "public"."call_rooms"
  enable row level security;

create index idx_call_rooms_conversation
  on public.call_rooms using btree (conversation_id);

create table "public"."call_participants" (
  "call_room_id" uuid                     not null,
  "user_id"      uuid                     not null,
  "joined_at"    timestamp with time zone not null default now(),
  "left_at"      timestamp with time zone,
  constraint "call_participants_pkey" primary key (call_room_id, user_id),
  constraint "call_participants_call_room_id_fkey"
    foreign key (call_room_id) references public.call_rooms(id) on delete cascade,
  constraint "call_participants_user_id_fkey"
    foreign key (user_id) references public.profiles(id) on delete cascade
);

alter table "public"."call_participants"
  enable row level security;


-- ------------------------------------------------------------
-- 2) FUNÇÕES (helpers RLS "security definer" primeiro -- exigem que
--    conversation_participants/group_members já existam, por serem
--    "language sql" e validadas na criação; as plpgsql podem vir em
--    qualquer ordem a partir daqui)
-- ------------------------------------------------------------

-- Função security definer para evitar subqueries auto-referenciadas nas
-- policies de conversation_participants/messages/message_media/call_rooms
-- (o mesmo padrão standard usado em apps de chat sobre Postgres RLS).
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to "authenticated", "service_role";

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to "authenticated", "service_role";

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

-- Cria automaticamente a conversa de grupo quando um grupo é criado.
-- A app nunca cria esta conversa manualmente (secção 19/70 do prompt
-- mestre).
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

-- Secção 70 do prompt mestre: group_members é a fonte única de verdade.
-- conversation_participants da conversa do grupo é sincronizado A PARTIR
-- DAQUI, nunca ao contrário, e nunca escrito manualmente pela app para
-- conversas de grupo.
create or replace function public.sync_group_conversation_participants()
returns trigger
language plpgsql
security definer
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


-- ------------------------------------------------------------
-- 3) TRIGGERS, POLICIES E GRANTS (agora que tabelas e funções já
--    existem todas)
-- ------------------------------------------------------------

-- groups --------------------------------------------------------

-- Cria automaticamente a conversa de grupo associada (ver
-- handle_new_group() acima) -- nunca criar a conversa manualmente
-- a partir da app.
create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group();

create policy "Membros veem o grupo" on "public"."groups"
  for select
  to "authenticated"
  using (public.is_group_member(id));

create policy "Utilizador autenticado cria grupo (torna-se owner)" on "public"."groups"
  for insert
  to "authenticated"
  with check (owner_id = auth.uid());

create policy "Owner/admin atualiza os dados do grupo" on "public"."groups"
  for update
  to "authenticated"
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

grant select, insert, update on table "public"."groups" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."groups" to "postgres", "service_role";

revoke all on table "public"."groups" from "anon";

-- group_members -------------------------------------------------

create trigger on_group_members_change
  after insert or update or delete on public.group_members
  for each row
  execute function public.sync_group_conversation_participants();

create policy "Membros veem os membros do grupo" on "public"."group_members"
  for select
  to "authenticated"
  using (public.is_group_member(group_id));

create policy "Owner/admin adiciona membros" on "public"."group_members"
  for insert
  to "authenticated"
  with check (
    -- o próprio dono ao criar o grupo, ou um owner/admin já existente
    (user_id = auth.uid() and group_id in (select id from public.groups where owner_id = auth.uid()))
    or group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

grant select, insert on table "public"."group_members" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."group_members" to "postgres", "service_role";

revoke all on table "public"."group_members" from "anon";

-- conversations ---------------------------------------------------

create trigger conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.handle_updated_at();

create policy "Participantes veem as suas conversas" on "public"."conversations"
  for select
  to "authenticated"
  using (public.is_conversation_participant(id));

grant select on table "public"."conversations" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."conversations" to "postgres", "service_role";

revoke all on table "public"."conversations" from "anon";

-- conversation_participants -----------------------------------------

-- Nota (secção 70 do prompt mestre): para conversas de grupo, esta tabela
-- é sincronizada a partir de group_members por trigger
-- (sync_group_conversation_participants) -- nunca escrita manual aqui
-- para conversas de grupo.
create policy "Participantes veem os participantes das suas conversas"
  on "public"."conversation_participants"
  for select
  to "authenticated"
  using (public.is_conversation_participant(conversation_id));

grant select on table "public"."conversation_participants" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."conversation_participants" to "postgres", "service_role";

revoke all on table "public"."conversation_participants" from "anon";

-- messages ----------------------------------------------------------

create policy "Participantes veem mensagens das suas conversas" on "public"."messages"
  for select
  to "authenticated"
  using (public.is_conversation_participant(conversation_id));

create policy "Participantes enviam mensagens nas suas conversas" on "public"."messages"
  for insert
  to "authenticated"
  with check ((sender_id = auth.uid()) and public.is_conversation_participant(conversation_id));

-- Só permite soft delete (ver deleted_at) -- a app nunca deve fazer DELETE
-- real de uma mensagem, para preservar a política de retenção (secção 74).
create policy "Autor apaga (soft delete) a sua mensagem" on "public"."messages"
  for update
  to "authenticated"
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

grant select, insert, update on table "public"."messages" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."messages" to "postgres", "service_role";

revoke all on table "public"."messages" from "anon";

-- message_media -------------------------------------------------------

create policy "Participantes veem media das suas conversas" on "public"."message_media"
  for select
  to "authenticated"
  using (
    message_id in (
      select m.id from public.messages m
      where public.is_conversation_participant(m.conversation_id)
    )
  );

create policy "Autor da mensagem associa media" on "public"."message_media"
  for insert
  to "authenticated"
  with check (
    message_id in (
      select id from public.messages where sender_id = auth.uid()
    )
  );

grant select, insert on table "public"."message_media" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."message_media" to "postgres", "service_role";

revoke all on table "public"."message_media" from "anon";

-- call_rooms ------------------------------------------------------------

-- Nota: o token LiveKit em si NUNCA é gerado aqui -- isto só regista que
-- uma chamada foi iniciada. A geração do token acontece numa Edge
-- Function (secção 22/67), que valida participação antes de emitir.
create policy "Participantes veem as chamadas da conversa" on "public"."call_rooms"
  for select
  to "authenticated"
  using (public.is_conversation_participant(conversation_id));

create policy "Participante inicia chamada na conversa" on "public"."call_rooms"
  for insert
  to "authenticated"
  with check ((started_by = auth.uid()) and public.is_conversation_participant(conversation_id));

grant select, insert on table "public"."call_rooms" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."call_rooms" to "postgres", "service_role";

revoke all on table "public"."call_rooms" from "anon";

-- call_participants -------------------------------------------------------

create policy "Participantes veem quem esteve na chamada" on "public"."call_participants"
  for select
  to "authenticated"
  using (
    call_room_id in (
      select cr.id from public.call_rooms cr
      where public.is_conversation_participant(cr.conversation_id)
    )
  );

create policy "Utilizador regista a sua propria entrada/saida" on "public"."call_participants"
  for insert
  to "authenticated"
  with check (user_id = auth.uid());

grant select, insert on table "public"."call_participants" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."call_participants" to "postgres", "service_role";

revoke all on table "public"."call_participants" from "anon";


-- ------------------------------------------------------------
-- 4) notifications.type -- alargar CHECK para o módulo social
-- ------------------------------------------------------------

alter table "public"."notifications"
  drop constraint "notifications_type_check";

alter table "public"."notifications"
  add constraint "notifications_type_check"
  check ((type = ANY (ARRAY['reply'::text, 'mention'::text, 'like'::text, 'message'::text, 'call'::text, 'group_invite'::text])));
