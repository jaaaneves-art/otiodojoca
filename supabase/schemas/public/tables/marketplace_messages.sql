create table "public"."marketplace_messages" (
  "id"              integer                  not null default nextval('public.marketplace_messages_id_seq'::regclass),
  "conversation_id" integer                  not null,
  "sender_id"       uuid                     not null,
  "content"         text                     not null,
  "read_at"         timestamp with time zone,
  "created_at"      timestamp with time zone default now(),
  constraint "marketplace_messages_conversation_id_fkey" foreign key (conversation_id) references public.marketplace_conversations(id) on delete cascade,
  constraint "marketplace_messages_pkey" primary key (id),
  constraint "marketplace_messages_sender_id_fkey" foreign key (sender_id) references auth.users(id) on delete cascade
);

alter table "public"."marketplace_messages"
  enable row level security;

create index idx_messages_conversation on public.marketplace_messages using btree (conversation_id);

create index idx_messages_sender on public.marketplace_messages using btree (sender_id);

create policy "Users mark their received messages as read" on "public"."marketplace_messages"
  for update
  to PUBLIC
  using (((conversation_id in ( select marketplace_conversations.id
   from public.marketplace_conversations
  where ((marketplace_conversations.buyer_id = auth.uid()) or (marketplace_conversations.seller_id = auth.uid())))) AND (sender_id <> auth.uid())));

create policy "Users see messages in their conversations" on "public"."marketplace_messages"
  for select
  to PUBLIC
  using ((conversation_id in ( select marketplace_conversations.id
   from public.marketplace_conversations
  where ((marketplace_conversations.buyer_id = auth.uid()) or (marketplace_conversations.seller_id = auth.uid())))));

create policy "Users send messages in their conversations" on "public"."marketplace_messages"
  for insert
  to PUBLIC
  with check (((auth.uid() = sender_id) AND (conversation_id IN ( SELECT marketplace_conversations.id
   FROM public.marketplace_conversations
  WHERE ((marketplace_conversations.buyer_id = auth.uid()) OR (marketplace_conversations.seller_id = auth.uid()))))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_messages" to "postgres", "service_role";

revoke all on table "public"."marketplace_messages" from "anon";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."marketplace_messages" to "anon";

revoke all ("read_at") on table "public"."marketplace_messages" from "authenticated";

grant update ("read_at") on table "public"."marketplace_messages" to "authenticated";

revoke all on table "public"."marketplace_messages" from "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."marketplace_messages" to "authenticated";
