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
