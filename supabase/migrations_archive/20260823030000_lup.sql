-- ============================================================
-- LUP — módulo de economia circular / excedentes (comida e outros
-- recursos) para consumo humano, animal e compostagem
-- ============================================================
-- Segue exatamente o mesmo padrão do Gran Bazar (ver
-- docs/GRAN-BAZAR.md e supabase/migrations/20260822200000_gran_bazar.sql):
-- reutiliza marketplace_ads (mais um valor em "module"), marketplace_photos,
-- marketplace_favorites e marketplace_conversations/messages tal e qual,
-- sem nenhuma tabela nova de anúncios. Ver docs/LUP.md para a arquitetura
-- completa.

-- ------------------------------------------------------------
-- 1. marketplace_ads.module: acrescentar 'lup'
-- ------------------------------------------------------------
-- Aditivo: a coluna e os valores existentes ('mercado-da-terra',
-- 'gran-bazar') não são tocados, só se acrescenta mais um valor válido.
alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_module_check";
alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_module_check"
  check (module = ANY (ARRAY['mercado-da-terra'::text, 'gran-bazar'::text, 'lup'::text]));

-- Nota: marketplace_ads.status já tem um CHECK amplo o suficiente
-- (draft/active/reserved/sold/traded/given/expired/cancelled/inactive,
-- ver migration do Gran Bazar) para cobrir o ciclo de vida de um anúncio
-- do Lup — "given" serve para uma doação já entregue, "expired" para uma
-- janela de recolha que passou sem ninguém levantar. Não precisa de
-- alteração.

-- ------------------------------------------------------------
-- 2. categories: novo type 'lup' + as 3 categorias fixas
-- ------------------------------------------------------------
-- Mesmo ponto de extensão já usado por 'bazar' (ver migration do Gran
-- Bazar). Ao contrário do Gran Bazar, o Lup não pretende crescer a lista
-- de categorias no futuro — são deliberadamente só estas 3, o "três
-- ciclos" que dá identidade ao módulo (inspirado no MVP SobraCiclo que
-- lhe deu origem) — mas o mecanismo de "insert com on conflict do
-- nothing" fica igual, para não fechar a porta a isso se um dia for
-- preciso.
alter table "public"."categories"
  drop constraint if exists "categories_type_check";
alter table "public"."categories"
  add constraint "categories_type_check"
  check (type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text, 'bazar'::text, 'lup'::text]));

insert into "public"."categories" (name, slug, type, icon, sort_order) values
  ('Consumo Humano',     'lup-humano',       'lup', '🥗', 1),
  ('Alimentação Animal', 'lup-animal',       'lup', '🐾', 2),
  ('Compostagem',        'lup-compostagem',  'lup', '🌱', 3)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 3. Fotos, favoritos, mensagens, storage
-- ------------------------------------------------------------
-- Sem alterações de esquema: marketplace_photos, marketplace_favorites,
-- marketplace_conversations/marketplace_messages/
-- marketplace_message_attachments e o bucket "marketplace-photos" já
-- existem e já são genéricos (ligados só por ad_id) — reutilizados tal
-- e qual, tal como o Gran Bazar já fazia. Nada a acrescentar aqui.
