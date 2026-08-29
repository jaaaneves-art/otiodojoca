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
