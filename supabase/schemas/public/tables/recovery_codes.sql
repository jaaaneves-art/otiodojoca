create table "public"."recovery_codes" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid                     not null,
  "code_hash"  text                     not null,
  "used"       boolean                  not null default false,
  "created_at" timestamp with time zone not null default now(),
  constraint "recovery_codes_pkey" primary key (id),
  constraint "recovery_codes_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete cascade
);

alter table "public"."recovery_codes"
  enable row level security;

create index recovery_codes_used_idx on public.recovery_codes using btree (user_id)
  where (used = false);

create index recovery_codes_user_id_idx on public.recovery_codes using btree (user_id);

create policy "recovery_codes_delete_own" on "public"."recovery_codes"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "recovery_codes_insert_own" on "public"."recovery_codes"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "recovery_codes_select_own" on "public"."recovery_codes"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "recovery_codes_update_own" on "public"."recovery_codes"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."recovery_codes" to "anon", "authenticated", "postgres", "service_role";
