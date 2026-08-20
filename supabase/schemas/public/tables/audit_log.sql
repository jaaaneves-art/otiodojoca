create table "public"."audit_log" (
  "id"         uuid                     not null default gen_random_uuid(),
  "user_id"    uuid,
  "action"     text                     not null,
  "success"    boolean                  not null default true,
  "ip"         inet,
  "user_agent" text,
  "details"    jsonb,
  "created_at" timestamp with time zone not null default now(),
  constraint "audit_log_pkey" primary key (id),
  constraint "audit_log_user_id_fkey" foreign key (user_id) references public.profiles(id) on delete set null
);

alter table "public"."audit_log"
  enable row level security;

create index audit_log_action_idx on public.audit_log using btree (action);

create index audit_log_created_at_idx on public.audit_log using btree (created_at);

create index audit_log_user_id_idx on public.audit_log using btree (user_id);

create policy "audit_log_insert_auth" on "public"."audit_log"
  for insert
  to "service_role"
  with check (true);

create policy "audit_log_select_own" on "public"."audit_log"
  for select
  to PUBLIC
  using (((auth.uid() = user_id) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."audit_log" to "anon", "authenticated", "postgres", "service_role";
