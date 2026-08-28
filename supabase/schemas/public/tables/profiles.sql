create table "public"."profiles" (
  "id"                     uuid                     not null,
  "username"               text                     not null,
  "display_name"           text,
  "bio"                    text,
  "location"               text,
  "avatar_url"             text,
  "reputation"             integer                  default 0,
  "is_admin"               boolean                  default false,
  "created_at"             timestamp with time zone default now(),
  "updated_at"             timestamp with time zone default now(),
  "email"                  text,
  "two_factor_enabled"     boolean                  not null default false,
  "mfa_setup_dismissed_at" timestamp with time zone,
  "deleted_at"             timestamp with time zone,
  constraint "profiles_id_fkey" foreign key (id) references auth.users(id) on delete cascade,
  constraint "profiles_pkey" primary key (id),
  constraint "profiles_username_key" unique (username)
);

alter table "public"."profiles"
  enable row level security;

alter table "public"."profiles"
  add column "role" public.user_role not null default 'user'::public.user_role;

create index idx_profiles_username on public.profiles using btree (username);

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create policy "Perfis publicos visiveis para todos" on "public"."profiles"
  for select
  to PUBLIC
  using (true);

create policy "Sistema cria perfis automaticamente" on "public"."profiles"
  for insert
  to "service_role"
  with check (true);

create policy "Utilizadores editam o seu proprio perfil" on "public"."profiles"
  for update
  to "authenticated"
  using ((auth.uid() = id))
  with check ((auth.uid() = id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "postgres", "service_role";

revoke all on table "public"."profiles" from "anon";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."profiles" to "anon";

revoke all ("avatar_url") on table "public"."profiles" from "authenticated";

grant update ("avatar_url") on table "public"."profiles" to "authenticated";

revoke all ("bio") on table "public"."profiles" from "authenticated";

grant update ("bio") on table "public"."profiles" to "authenticated";

revoke all ("display_name") on table "public"."profiles" from "authenticated";

grant update ("display_name") on table "public"."profiles" to "authenticated";

revoke all ("location") on table "public"."profiles" from "authenticated";

grant update ("location") on table "public"."profiles" to "authenticated";

revoke all ("username") on table "public"."profiles" from "authenticated";

grant update ("username") on table "public"."profiles" to "authenticated";

revoke all ("mfa_setup_dismissed_at") on table "public"."profiles" from "authenticated";

grant update ("mfa_setup_dismissed_at") on table "public"."profiles" to "authenticated";

revoke all on table "public"."profiles" from "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate on table "public"."profiles" to "authenticated";
