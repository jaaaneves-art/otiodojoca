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
