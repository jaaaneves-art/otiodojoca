-- ============================================================
-- IMÓVEIS — módulo de marketplace de imóveis (venda + leilão)
-- ============================================================
-- Segue exatamente o mesmo padrão do Gran Bazar e do Lup (ver
-- docs/GRAN-BAZAR.md, docs/LUP.md e as migrations
-- 20260822200000_gran_bazar.sql / 20260823000000_gran_bazar_leiloes_ativos.sql
-- / 20260823030000_lup.sql): reutiliza marketplace_ads (mais um valor em
-- "module"), marketplace_photos, marketplace_favorites,
-- marketplace_conversations/messages/message_attachments, o bucket
-- "marketplace-photos", e — porque este módulo tem leilão — também
-- marketplace_auctions/marketplace_auction_bids e o mecanismo de licitação
-- já construído e corrigido para o Gran Bazar (gran_bazar_place_bid(),
-- gran_bazar_advance_auctions()). Sem nenhuma tabela nova. Ver
-- docs/IMOVEIS.md para a arquitetura completa.
--
-- Nasceu da auditoria a um prompt externo + MVP React "Lup Imóveis"
-- (claude/AUDITORIA-LUP-IMOVEIS-20260824.md no projeto Claude) que propunha
-- tabelas `properties`/`property_auctions`/`property_auction_bids` novas e
-- um motor de leilão próprio, client-side, sem lock de linha — exatamente o
-- que a arquitetura desta plataforma já decidiu evitar. O nome "Imóveis"
-- (sem o prefixo "Lup") foi escolhido porque 'lup' já é o módulo de
-- economia circular/excedentes — usar o mesmo prefixo de marca para um
-- domínio completamente diferente só criaria confusão.

-- ------------------------------------------------------------
-- 1. marketplace_ads.module: acrescentar 'imoveis'
-- ------------------------------------------------------------
-- Aditivo: a coluna e os valores existentes ('mercado-da-terra',
-- 'gran-bazar', 'lup', 'viaturas') não são tocados, só se acrescenta mais
-- um valor válido.
alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_module_check";
alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_module_check"
  check (module = ANY (ARRAY['mercado-da-terra'::text, 'gran-bazar'::text, 'lup'::text, 'viaturas'::text, 'imoveis'::text]));

-- Nota: marketplace_ads.status já tem um CHECK amplo o suficiente
-- (draft/active/reserved/sold/traded/given/expired/cancelled/inactive, ver
-- migration do Gran Bazar) para cobrir o ciclo de vida de um anúncio de
-- imóvel — "sold" para venda direta concluída ou leilão com vencedor,
-- "expired" para leilão sem lances. Não precisa de alteração.

-- ------------------------------------------------------------
-- 2. categories: novo type 'imoveis' + tipos de imóvel como categorias
-- ------------------------------------------------------------
-- Mesmo ponto de extensão já usado por 'bazar' e 'lup'. "Tipo de imóvel"
-- (apartamento, moradia, terreno...) mapeia para category_id, exatamente
-- como o Gran Bazar usa categorias para o tipo de artigo — category_id
-- fica ortogonal a marketplace_ads.type (que aqui só distingue
-- venda/leilão).
alter table "public"."categories"
  drop constraint if exists "categories_type_check";
alter table "public"."categories"
  add constraint "categories_type_check"
  check (type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text, 'bazar'::text, 'lup'::text, 'viaturas'::text, 'imoveis'::text]));

insert into "public"."categories" (name, slug, type, icon, sort_order) values
  ('Apartamento', 'imoveis-apartamento', 'imoveis', '🏢', 1),
  ('Moradia',     'imoveis-moradia',     'imoveis', '🏡', 2),
  ('Terreno',     'imoveis-terreno',     'imoveis', '🌳', 3),
  ('Loja',        'imoveis-loja',        'imoveis', '🏬', 4),
  ('Armazém',     'imoveis-armazem',     'imoveis', '🏭', 5),
  ('Escritório',  'imoveis-escritorio',  'imoveis', '💼', 6),
  ('Quinta',      'imoveis-quinta',      'imoveis', '🚜', 7),
  ('Garagem',     'imoveis-garagem',     'imoveis', '🚗', 8),
  ('Outro',       'imoveis-outro',       'imoveis', '📦', 9)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 3. Leilões: reaproveitar o motor do Gran Bazar em vez de duplicar
-- ------------------------------------------------------------
-- gran_bazar_place_bid() e gran_bazar_advance_auctions() (migration
-- 20260823000000_gran_bazar_leiloes_ativos.sql) já são completamente
-- genéricos — nenhuma das duas funções filtra por module, trabalham só a
-- partir de marketplace_auctions/marketplace_ads. Não precisam de
-- alteração nenhuma. O único ponto realmente amarrado ao Gran Bazar era o
-- trigger que cria a linha em marketplace_auctions a partir de
-- marketplace_ads.details — esse sim tinha "new.module <> 'gran-bazar'" a
-- bloquear qualquer outro módulo. Alargado abaixo para incluir 'imoveis'
-- (allowlist explícita, não "qualquer módulo", para não ativar leilão sem
-- querer em mercado-da-terra ou lup, que nunca tiveram esse tipo de
-- anúncio).
create or replace function public.gran_bazar_create_auction_if_needed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start_price     numeric(10,2);
  v_min_increment   numeric(10,2);
  v_starts_at       timestamptz;
  v_ends_at         timestamptz;
begin
  if new.module <> ALL (ARRAY['gran-bazar'::text, 'imoveis'::text]) or new.type <> 'leilao' then
    return new;
  end if;

  -- já existe leilão para este anúncio (ex: update repetido) — não duplicar
  if exists (select 1 from public.marketplace_auctions where ad_id = new.id) then
    return new;
  end if;

  if new.details is null or new.details->>'start_price' is null then
    raise exception 'Leilão sem preço inicial (details.start_price em falta)';
  end if;
  if new.details->>'ends_at' is null then
    raise exception 'Leilão sem data de encerramento (details.ends_at em falta)';
  end if;

  v_start_price   := (new.details->>'start_price')::numeric;
  v_min_increment := coalesce((new.details->>'minimum_increment')::numeric, 1.00);
  v_starts_at     := coalesce((new.details->>'starts_at')::timestamptz, now());
  v_ends_at       := (new.details->>'ends_at')::timestamptz;

  if v_ends_at <= v_starts_at then
    raise exception 'A data de encerramento do leilão tem de ser depois da data de início';
  end if;

  insert into public.marketplace_auctions (
    ad_id, start_price, current_price, minimum_increment, starts_at, ends_at, status
  ) values (
    new.id, v_start_price, v_start_price, v_min_increment, v_starts_at, v_ends_at,
    case when v_starts_at <= now() then 'live' else 'scheduled' end
  );

  return new;
end;
$$;

-- O trigger em si (nome, tabela, disparo) não muda — só a função por trás
-- dele. "create or replace function" acima já é suficiente; isto só
-- confirma que o trigger continua ligado (idempotente).
drop trigger if exists gran_bazar_create_auction_if_needed on public.marketplace_ads;
create trigger gran_bazar_create_auction_if_needed
  after insert or update of type, module on public.marketplace_ads
  for each row
  execute function public.gran_bazar_create_auction_if_needed();

-- ------------------------------------------------------------
-- 4. Fotos, favoritos, mensagens, storage
-- ------------------------------------------------------------
-- Sem alterações de esquema: marketplace_photos, marketplace_favorites,
-- marketplace_conversations/marketplace_messages/
-- marketplace_message_attachments e o bucket "marketplace-photos" já
-- existem e já são genéricos (ligados só por ad_id) — reutilizados tal e
-- qual, tal como o Gran Bazar e o Lup já faziam. Nada a acrescentar aqui.
