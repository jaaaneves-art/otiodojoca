create table "public"."marketplace_favorites" (
  "id"         integer                  not null default nextval('public.marketplace_favorites_id_seq'::regclass),
  "user_id"    uuid                     not null,
  "ad_id"      integer                  not null,
  "created_at" timestamp with time zone default now(),
  constraint "marketplace_favorites_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade,
  constraint "marketplace_favorites_pkey" primary key (id),
  constraint "marketplace_favorites_user_id_ad_id_key" unique (user_id, ad_id),
  constraint "marketplace_favorites_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."marketplace_favorites"
  enable row level security;

create index idx_favorites_ad on public.marketplace_favorites using btree (ad_id);

create index idx_favorites_user on public.marketplace_favorites using btree (user_id);

create policy "Users add their own favorites" on "public"."marketplace_favorites"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "Users remove their own favorites" on "public"."marketplace_favorites"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Users see their own favorites" on "public"."marketplace_favorites"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_favorites" to "anon", "authenticated", "postgres", "service_role";
