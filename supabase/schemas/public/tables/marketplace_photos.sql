create table "public"."marketplace_photos" (
  "id"           integer                  not null default nextval('public.marketplace_photos_id_seq'::regclass),
  "ad_id"        integer                  not null,
  "storage_path" text                     not null,
  "sort_order"   integer                  default 0,
  "created_at"   timestamp with time zone default now(),
  constraint "marketplace_photos_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade,
  constraint "marketplace_photos_pkey" primary key (id)
);

alter table "public"."marketplace_photos"
  enable row level security;

create index idx_marketplace_photos_ad on public.marketplace_photos using btree (ad_id);

create policy "Autores gerem fotos dos seus anuncios" on "public"."marketplace_photos"
  for all
  to PUBLIC
  using ((exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_photos.ad_id) AND (marketplace_ads.author_id = auth.uid())))));

create policy "Fotos de anuncios ativos visiveis" on "public"."marketplace_photos"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.marketplace_ads
  where ((marketplace_ads.id = marketplace_photos.ad_id) AND (marketplace_ads.status = 'active'::text)))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_photos" to "anon", "authenticated", "postgres", "service_role";
