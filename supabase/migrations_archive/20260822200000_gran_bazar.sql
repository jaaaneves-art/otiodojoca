-- ============================================================
-- GRAN BAZAR — novo módulo de marketplace/classificados comunitário
-- ============================================================
-- Reutiliza a infra-estrutura já existente do Mercado da Terra em vez de
-- duplicar tabelas: marketplace_ads (com uma nova coluna "module" para
-- distinguir os dois marketplaces), marketplace_photos, marketplace_favorites
-- e marketplace_conversations/messages/message_attachments (já genéricas,
-- ligadas só por ad_id). Ver docs/GRAN-BAZAR.md para a arquitetura completa.

-- ------------------------------------------------------------
-- 1. marketplace_ads: distinguir o módulo dono do anúncio
-- ------------------------------------------------------------
-- Aditivo e retrocompatível: todas as linhas existentes (Mercado da Terra)
-- ficam automaticamente com module = 'mercado-da-terra' via o default.
alter table "public"."marketplace_ads"
  add column if not exists "module" text not null default 'mercado-da-terra';

alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_module_check";
alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_module_check"
  check (module = ANY (ARRAY['mercado-da-terra'::text, 'gran-bazar'::text]));

create index if not exists idx_marketplace_ads_module on public.marketplace_ads using btree (module, status, created_at desc);

-- ------------------------------------------------------------
-- 2. marketplace_ads.status: ampliar para os estados pedidos
-- ------------------------------------------------------------
-- Amplia o CHECK existente (active/sold/inactive) para incluir o conjunto
-- completo pedido para o Gran Bazar. Todos os valores antigos continuam
-- válidos — isto não migra nenhuma linha existente, só permite novos valores.
alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_status_check";
alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_status_check"
  check (status = ANY (ARRAY[
    'draft'::text, 'active'::text, 'reserved'::text, 'sold'::text,
    'traded'::text, 'given'::text, 'expired'::text, 'cancelled'::text,
    'inactive'::text
  ]));

-- ------------------------------------------------------------
-- 3. categories: novo type 'bazar' + categorias iniciais
-- ------------------------------------------------------------
-- categories.type já previa 'marketplace' ao lado de forum/almanaque/general;
-- este é o mesmo ponto de extensão, só a acrescentar 'bazar'. Isto evita
-- repetir o problema já existente no Mercado da Terra, onde marketplace_ads
-- .category_id aponta na realidade para "categories" e não para a tabela
-- paralela "marketplace_categories" que o formulário usa.
alter table "public"."categories"
  drop constraint if exists "categories_type_check";
alter table "public"."categories"
  add constraint "categories_type_check"
  check (type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text, 'bazar'::text]));

insert into "public"."categories" (name, slug, type, icon, sort_order) values
  ('Casa',          'bazar-casa',          'bazar', '🏠', 1),
  ('Jardim',        'bazar-jardim',        'bazar', '🌿', 2),
  ('Ferramentas',   'bazar-ferramentas',   'bazar', '🔧', 3),
  ('Eletrónica',    'bazar-eletronica',    'bazar', '🔌', 4),
  ('Informática',   'bazar-informatica',   'bazar', '💻', 5),
  ('Veículos',      'bazar-veiculos',      'bazar', '🚗', 6),
  ('Peças',         'bazar-pecas',         'bazar', '⚙️', 7),
  ('Roupa',         'bazar-roupa',         'bazar', '👕', 8),
  ('Calçado',       'bazar-calcado',       'bazar', '👟', 9),
  ('Livros',        'bazar-livros',        'bazar', '📚', 10),
  ('Música',        'bazar-musica',        'bazar', '🎵', 11),
  ('Colecionismo',  'bazar-colecionismo',  'bazar', '🧸', 12),
  ('Desporto',      'bazar-desporto',      'bazar', '⚽', 13),
  ('Crianças',      'bazar-criancas',      'bazar', '🧒', 14),
  ('Animais',       'bazar-animais',       'bazar', '🐾', 15),
  ('Agricultura',   'bazar-agricultura',   'bazar', '🚜', 16),
  ('Artesanato',    'bazar-artesanato',    'bazar', '🎨', 17),
  ('Outros',        'bazar-outros',        'bazar', '📦', 18)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 4. Leilões — arquitetura preparada (Nível 3: modelo de dados pronto)
-- ------------------------------------------------------------
-- IMPORTANTE (documentado também em docs/GRAN-BAZAR.md): estas tabelas
-- preparam o terreno para leilões, mas NÃO implementam licitação. Não existe
-- nenhum caminho de código nesta fase que permita a um utilizador dar um
-- lance. Isso fica para uma fase futura, que terá de resolver concorrência
-- (dois lances em simultâneo) com uma função Postgres transacional
-- (SELECT ... FOR UPDATE ou equivalente), nunca com um simples
-- "SELECT current_price" seguido de "UPDATE current_price" feito a partir
-- do frontend — ver secção 20 do briefing original / docs/GRAN-BAZAR.md.

create table if not exists "public"."marketplace_auctions" (
  "id"                 bigint generated always as identity primary key,
  "ad_id"              integer not null unique references public.marketplace_ads(id) on delete cascade,
  "start_price"        numeric(10,2) not null check (start_price >= 0),
  "current_price"      numeric(10,2) not null check (current_price >= 0),
  "minimum_increment"  numeric(10,2) not null default 1.00 check (minimum_increment > 0),
  "starts_at"          timestamp with time zone not null default now(),
  "ends_at"            timestamp with time zone not null,
  "status"             text not null default 'scheduled' check (status = ANY (ARRAY['scheduled'::text, 'live'::text, 'ended'::text, 'cancelled'::text])),
  "winner_id"          uuid references public.profiles(id),
  "created_at"         timestamp with time zone not null default now(),
  "updated_at"         timestamp with time zone not null default now(),
  constraint "marketplace_auctions_dates_check" check (ends_at > starts_at)
);

create index if not exists idx_marketplace_auctions_status_ends on public.marketplace_auctions using btree (status, ends_at);

create trigger marketplace_auctions_updated_at
  before update on public.marketplace_auctions
  for each row
  execute function public.handle_updated_at();

alter table "public"."marketplace_auctions" enable row level security;

drop policy if exists "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions";
create policy "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions"
  for select
  to PUBLIC
  using (exists (
    select 1 from public.marketplace_ads
    where marketplace_ads.id = marketplace_auctions.ad_id
      and marketplace_ads.status = 'active'
  ));

drop policy if exists "Autores gerem os leiloes dos seus anuncios" on "public"."marketplace_auctions";
create policy "Autores gerem os leiloes dos seus anuncios" on "public"."marketplace_auctions"
  for all
  to PUBLIC
  using (exists (
    select 1 from public.marketplace_ads
    where marketplace_ads.id = marketplace_auctions.ad_id
      and marketplace_ads.author_id = auth.uid()
  ));

grant delete, insert, select, update on table "public"."marketplace_auctions" to "anon", "authenticated", "postgres", "service_role";

-- Histórico de lances. Sem política de update/delete (histórico imutável) —
-- e sem NENHUM caminho de UI/servidor nesta fase que faça insert aqui.
create table if not exists "public"."marketplace_auction_bids" (
  "id"          bigint generated always as identity primary key,
  "auction_id"  bigint not null references public.marketplace_auctions(id) on delete cascade,
  "bidder_id"   uuid not null references public.profiles(id),
  "amount"      numeric(10,2) not null check (amount > 0),
  "created_at"  timestamp with time zone not null default now()
);

create index if not exists idx_marketplace_auction_bids_auction on public.marketplace_auction_bids using btree (auction_id, created_at desc);

alter table "public"."marketplace_auction_bids" enable row level security;

drop policy if exists "Historico de lances visivel para todos" on "public"."marketplace_auction_bids";
create policy "Historico de lances visivel para todos" on "public"."marketplace_auction_bids"
  for select
  to PUBLIC
  using (true);

-- Preparada para quando a licitação for implementada: só o próprio licitador
-- pode criar o seu lance, e nunca o autor do anúncio a licitar no seu leilão.
drop policy if exists "Licitadores criam os seus lances" on "public"."marketplace_auction_bids";
create policy "Licitadores criam os seus lances" on "public"."marketplace_auction_bids"
  for insert
  to PUBLIC
  with check (
    auth.uid() = bidder_id
    and not exists (
      select 1 from public.marketplace_auctions a
      join public.marketplace_ads ad on ad.id = a.ad_id
      where a.id = marketplace_auction_bids.auction_id
        and ad.author_id = auth.uid()
    )
  );

grant insert, select on table "public"."marketplace_auction_bids" to "anon", "authenticated", "postgres", "service_role";

-- ------------------------------------------------------------
-- 5. Storage: bucket "marketplace-photos" — declarar o que já existia
-- ------------------------------------------------------------
-- Este bucket já existe em produção (criado manualmente no Studio) e já é
-- usado pelo Mercado da Terra — não tinha nenhum ficheiro SQL versionado a
-- defini-lo nem às suas policies. O Gran Bazar vai reutilizá-lo tal e qual
-- (as fotos ficam na mesma tabela marketplace_photos, ligadas só por ad_id).
-- "on conflict do nothing" + "drop policy if exists" tornam isto idempotente:
-- não apaga nem substitui nada que já lá esteja, só garante que fica
-- reproduzível a partir daqui em diante. Se já existirem policies com nomes
-- diferentes destas no Studio, podem ficar redundantes lado a lado — vale a
-- pena confirmar no dashboard depois de aplicar esta migration.
insert into storage.buckets (id, name, public)
values ('marketplace-photos', 'marketplace-photos', true)
on conflict (id) do nothing;

drop policy if exists "Marketplace photos - leitura publica" on storage.objects;
create policy "Marketplace photos - leitura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'marketplace-photos');

drop policy if exists "Marketplace photos - upload autenticado" on storage.objects;
create policy "Marketplace photos - upload autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'marketplace-photos');

drop policy if exists "Marketplace photos - autor apaga as suas fotos" on storage.objects;
create policy "Marketplace photos - autor apaga as suas fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'marketplace-photos' and owner = auth.uid());
