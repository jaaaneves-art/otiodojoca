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
    public.is_group_manager(group_id)
    and role in ('admin', 'moderator', 'member')
  );

create policy "Owner/admin altera membros" on "public"."group_members"
  for update to "authenticated"
  using (public.is_group_manager(group_id) and role <> 'owner')
  with check (public.is_group_manager(group_id) and role in ('admin', 'moderator', 'member'));

create policy "Owner/admin remove membros" on "public"."group_members"
  for delete to "authenticated"
  using (public.is_group_manager(group_id) and role <> 'owner');

grant select, insert, delete on table "public"."group_members" to "authenticated";
grant update (role) on table "public"."group_members" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update
  on table "public"."group_members" to "postgres", "service_role";

revoke all on table "public"."group_members" from "anon";
