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

-- Cria automaticamente a conversa de grupo associada (ver
-- functions/handle_new_group.sql) -- nunca criar a conversa manualmente
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
