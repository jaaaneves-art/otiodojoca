-- ============================================================
-- VIATURAS (StandGo) — módulo de venda e leilão de viaturas
-- ============================================================
-- Segue exatamente o mesmo padrão já usado pelo Gran Bazar e pelo Lup (ver
-- docs/GRAN-BAZAR.md e docs/LUP.md): reutiliza marketplace_ads (mais um
-- valor em "module"), marketplace_photos, marketplace_favorites e
-- marketplace_conversations/messages tal e qual — sem nenhuma tabela nova
-- de anúncios. Ver docs/VIATURAS.md para a arquitetura completa.
--
-- Diferença em relação ao Lup: Viaturas QUER leilão (venda direta + leilão,
-- pedido explícito do utilizador), por isso esta migration também alarga o
-- trigger de leilões do Gran Bazar (secção 3 abaixo) — é a primeira vez que
-- um segundo módulo usa o motor de leilões já construído.

-- ------------------------------------------------------------
-- 1. marketplace_ads.module: acrescentar 'viaturas'
-- ------------------------------------------------------------
-- Aditivo: a coluna e os valores existentes ('mercado-da-terra',
-- 'gran-bazar', 'lup') não são tocados, só se acrescenta mais um valor válido.
alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_module_check";
alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_module_check"
  check (module = ANY (ARRAY['mercado-da-terra'::text, 'gran-bazar'::text, 'lup'::text, 'viaturas'::text]));

-- Nota: marketplace_ads.status já tem um CHECK amplo o suficiente
-- (draft/active/reserved/sold/traded/given/expired/cancelled/inactive, ver
-- migration do Gran Bazar) para cobrir o ciclo de vida de um anúncio de
-- Viaturas — "sold" quando vendida ou quando um leilão termina com
-- vencedor, "expired" quando um leilão termina sem lances. Não precisa de
-- alteração.

-- ------------------------------------------------------------
-- 2. categories: novo type 'viaturas' + categorias iniciais
-- ------------------------------------------------------------
-- Mesmo ponto de extensão já usado por 'bazar' e 'lup'. Ao contrário do
-- Lup (3 categorias fixas), mas à semelhança do Gran Bazar, esta lista pode
-- crescer no futuro só com inserts adicionais (on conflict do nothing).
alter table "public"."categories"
  drop constraint if exists "categories_type_check";
alter table "public"."categories"
  add constraint "categories_type_check"
  check (type = ANY (ARRAY['forum'::text, 'marketplace'::text, 'almanaque'::text, 'general'::text, 'bazar'::text, 'lup'::text, 'viaturas'::text]));

insert into "public"."categories" (name, slug, type, icon, sort_order) values
  ('Ligeiros de Passageiros',      'viaturas-ligeiros',    'viaturas', '🚗', 1),
  ('Comerciais e Carrinhas',       'viaturas-comerciais',  'viaturas', '🚐', 2),
  ('Motociclos',                   'viaturas-motociclos',  'viaturas', '🏍️', 3),
  ('Caravanas e Autocaravanas',    'viaturas-caravanas',   'viaturas', '🚌', 4),
  ('Reboques e Atrelados',         'viaturas-reboques',    'viaturas', '🚛', 5),
  ('Peças e Acessórios',           'viaturas-pecas',       'viaturas', '🔧', 6),
  ('Outros',                       'viaturas-outros',      'viaturas', '📦', 7)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 3. Leilões: alargar o trigger de criação a Viaturas
-- ------------------------------------------------------------
-- gran_bazar_create_auction_if_needed() (ver
-- supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql) só
-- criava a linha em marketplace_auctions para module = 'gran-bazar'. É a
-- única parte do motor de leilões que tinha essa restrição — RLS,
-- gran_bazar_place_bid() e gran_bazar_advance_auctions() já são genéricas
-- (não filtram por module em lado nenhum), porque operam sobre
-- marketplace_auctions/marketplace_auction_bids diretamente, já ligadas ao
-- anúncio certo por ad_id. Por isso esta é a ÚNICA alteração necessária
-- para o leilão de viaturas funcionar de ponta a ponta com o mesmo motor —
-- mantém-se o nome da função (menor raio de mudança: não obriga a
-- recriar o trigger com outro nome nem a atualizar a documentação
-- existente) e o comportamento para 'gran-bazar' fica byte a byte igual.
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
  if new.module not in ('gran-bazar', 'viaturas') or new.type <> 'leilao' then
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

  -- casts explícitos: jsonb->>'chave' devolve text, e o Postgres não o
  -- converte implicitamente para numeric/timestamptz neste contexto.
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

-- Trigger já existia (criado na migration de leilões do Gran Bazar) — só a
-- função foi substituída acima (create or replace), não é preciso recriar
-- o trigger em si.

-- ------------------------------------------------------------
-- 4. Fotos, favoritos, mensagens, storage
-- ------------------------------------------------------------
-- Sem alterações de esquema: marketplace_photos, marketplace_favorites,
-- marketplace_conversations/marketplace_messages/
-- marketplace_message_attachments e o bucket "marketplace-photos" já
-- existem e já são genéricos (ligados só por ad_id) — reutilizados tal e
-- qual, tal como o Gran Bazar e o Lup já faziam. Nada a acrescentar aqui.
