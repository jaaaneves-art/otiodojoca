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

create index idx_messages_conversation
  on public.messages using btree (conversation_id, created_at desc);

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
