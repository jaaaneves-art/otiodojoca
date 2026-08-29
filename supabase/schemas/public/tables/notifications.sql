create table "public"."notifications" (
  "id"         integer                  not null default nextval('public.notifications_id_seq'::regclass),
  "user_id"    uuid                     not null,
  "type"       text                     not null,
  "message"    text                     not null,
  "link"       text,
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
