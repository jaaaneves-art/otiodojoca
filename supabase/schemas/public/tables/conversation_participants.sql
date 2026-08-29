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
