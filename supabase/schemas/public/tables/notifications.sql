create table "public"."notifications" (
  "id"         integer                  not null default nextval('public.notifications_id_seq'::regclass),
  "user_id"    uuid                     not null,
  "type"       text                     not null,
  "message"    text                     not null,
  "link"       text,
  "social_message_id" uuid references public.messages(id) on delete cascade,
  "is_read"    boolean                  default false,
  "created_at" timestamp with time zone default now(),
  constraint "notifications_pkey" primary key (id),
  constraint "notifications_type_check" check ((type = ANY (ARRAY['reply'::text, 'mention'::text, 'like'::text, 'message'::text, 'call'::text, 'group_invite'::text]))),
  constraint "notifications_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade
);

alter table "public"."notifications"
  enable row level security;

create index idx_notifications_user on public.notifications using btree (user_id, is_read, created_at desc);

create policy "Dono marca como lida" on "public"."notifications"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Notificacoes so visiveis para o dono" on "public"."notifications"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Sistema cria notificacoes" on "public"."notifications"
  for insert
  to "service_role"
  with check (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."notifications" to "anon", "authenticated", "postgres", "service_role";

create unique index social_notification_once on public.notifications(user_id, social_message_id)
  where social_message_id is not null;
-- As policies existentes continuam a controlar as notificações dos outros módulos.
create policy "social notification visibility" on public.notifications as restrictive
for select to public using (social_message_id is null or exists (
  select 1 from public.messages m where m.id = social_message_id and m.deleted_at is null
    and public.is_conversation_participant(m.conversation_id)
));


create trigger social_notification_guard before update on public.notifications
for each row execute function public.social_notification_guard();

create trigger social_notification_read_event after update of is_read on public.notifications
for each row execute function public.social_notification_read_event();
