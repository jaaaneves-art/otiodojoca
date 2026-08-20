create table "public"."marketplace_ads" (
  "id"             integer                  not null default nextval('public.marketplace_ads_id_seq'::regclass),
  "author_id"      uuid                     not null,
  "category_id"    integer,
  "title"          text                     not null,
  "description"    text,
  "price"          numeric(10,2),
  "price_type"     text                     default 'fixed'::text,
  "location"       text,
  "contact_method" text                     default 'message'::text,
  "contact_info"   text,
  "status"         text                     default 'active'::text,
  "expires_at"     timestamp with time zone default (now() + '30 days'::interval),
  "created_at"     timestamp with time zone default now(),
  "updated_at"     timestamp with time zone default now(),
  "type"           text                     not null default 'sale'::text,
  "details"        jsonb                    not null default '{}'::jsonb,
  "freguesia_id"   bigint,
  "municipio"      character varying(100),
  constraint "marketplace_ads_category_id_fkey" foreign key (category_id) references public.categories(id),
  constraint "marketplace_ads_contact_method_check" check ((contact_method = ANY (ARRAY['message'::text, 'phone'::text, 'email'::text]))),
  constraint "marketplace_ads_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id),
  constraint "marketplace_ads_pkey" primary key (id),
  constraint "marketplace_ads_price_type_check" check ((price_type = ANY (ARRAY['fixed'::text, 'negotiable'::text, 'free'::text]))),
  constraint "marketplace_ads_status_check" check ((status = ANY (ARRAY['active'::text, 'sold'::text, 'inactive'::text]))),
  constraint "marketplace_ads_author_id_fkey" foreign key (author_id) references public.profiles(id)
);

alter table "public"."marketplace_ads"
  enable row level security;

create index idx_marketplace_ads_author on public.marketplace_ads using btree (author_id);

create index idx_marketplace_ads_status on public.marketplace_ads using btree (status, created_at desc);

create trigger marketplace_ads_updated_at
  before update on public.marketplace_ads
  for each row
  execute function public.handle_updated_at();

create policy "Anuncios ativos visiveis para todos" on "public"."marketplace_ads"
  for select
  to PUBLIC
  using ((status = 'active'::text));

create policy "Autores gerem os seus anuncios" on "public"."marketplace_ads"
  for all
  to PUBLIC
  using ((auth.uid() = author_id));

create policy "Utilizadores autenticados criam anuncios" on "public"."marketplace_ads"
  for insert
  to PUBLIC
  with check ((auth.role() = 'authenticated'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_ads" to "anon", "authenticated", "postgres", "service_role";
