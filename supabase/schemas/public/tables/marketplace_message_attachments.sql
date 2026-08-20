create table "public"."marketplace_message_attachments" (
  "id"           integer                  not null default nextval('public.marketplace_message_attachments_id_seq'::regclass),
  "message_id"   integer                  not null,
  "storage_path" text                     not null,
  "file_name"    text                     not null,
  "file_type"    text                     not null,
  "created_at"   timestamp with time zone default now(),
  constraint "marketplace_message_attachments_pkey" primary key (id),
  constraint "marketplace_message_attachments_message_id_fkey" foreign key (message_id) references public.marketplace_messages(id) on delete cascade
);

alter table "public"."marketplace_message_attachments"
  enable row level security;

create index idx_msg_attachments_message on public.marketplace_message_attachments using btree (message_id);

create policy "Users add attachments to their messages" on "public"."marketplace_message_attachments"
  for insert
  to PUBLIC
  with check ((message_id IN ( SELECT m.id
   FROM (public.marketplace_messages m
     JOIN public.marketplace_conversations c ON ((m.conversation_id = c.id)))
  WHERE (((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())) AND (m.sender_id = auth.uid())))));

create policy "Users see attachments in their conversations" on "public"."marketplace_message_attachments"
  for select
  to PUBLIC
  using ((message_id in ( select m.id
   from (public.marketplace_messages m
     JOIN public.marketplace_conversations c on ((m.conversation_id = c.id)))
  where ((c.buyer_id = auth.uid()) or (c.seller_id = auth.uid())))));

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."marketplace_message_attachments"
  to "anon", "authenticated", "postgres", "service_role";
