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
  -- Expiração interna opcional; NULL conserva anexos ativos.
  -- Fase 5: apagados 30 dias; expirados +24h; órfãos 24h.
  "expires_at"       timestamp with time zone,
  constraint "message_media_pkey" primary key (id),
  constraint "message_media_message_id_fkey"
    foreign key (message_id) references public.messages(id) on delete cascade
);

alter table "public"."message_media"
  enable row level security;

create index idx_message_media_message
  on public.message_media using btree (message_id);

create policy "Participantes veem media das suas conversas" on public.message_media
for select to authenticated using (
  (expires_at is null or expires_at > now()) and exists (
    select 1 from public.messages m where m.id = message_id and m.deleted_at is null
      and public.is_conversation_participant(m.conversation_id))
  and (storage_provider <> 'supabase' or not public.social_media_is_claimed(storage_key))
);

create policy "Autor da mensagem associa media" on public.message_media
for insert to authenticated with check (
  storage_provider = 'supabase' and public.social_media_exists(storage_key, mime_type, size_bytes) and exists (
    select 1 from public.messages m where m.id = message_id
      and m.sender_id = auth.uid() and m.deleted_at is null
      and public.is_conversation_participant(m.conversation_id)
      and split_part(storage_key, '/', 1) = m.conversation_id::text
      and split_part(storage_key, '/', 2) = auth.uid()::text));

grant select, insert on table "public"."message_media" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."message_media" to "postgres", "service_role";

revoke all on table "public"."message_media" from "anon";

create index social_media_storage_key on public.message_media(storage_key)
  where storage_provider = 'supabase';
create trigger social_media_guard_link before insert or update on public.message_media
for each row execute function public.social_media_guard_link();
