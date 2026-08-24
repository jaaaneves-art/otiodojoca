-- ============================================================
-- GRAN BAZAR — Leilões, Nível 4: licitação real (ascendente simples)
-- ============================================================
-- Sobe a arquitetura preparada em 20260822200000_gran_bazar.sql (Nível 3:
-- só o modelo de dados) para um sistema de leilões funcional, com o
-- mecanismo decidido explicitamente: licitação ascendente simples — cada
-- licitador escreve o valor exato que está disposto a pagar agora (não é
-- "proxy bidding" com valor máximo secreto). É por isto que
-- marketplace_auction_bids só tem uma coluna "amount": não há máximo
-- secreto a guardar.
--
-- Corrige, em relação às várias propostas externas auditadas antes desta
-- implementação (ver claude/AUDITORIA-AUCTION-ENGINE-V0.2.0.md):
--  1. idempotência de policies (drop policy if exists + create) — já usado
--     aqui como em toda a base de código;
--  2. idempotência de lances (request_id + índice único parcial);
--  3. a policy "for all" do dono do leilão não tinha nenhuma restrição de
--     estado — permitia ao autor alterar/apagar o leilão a qualquer altura,
--     incluindo já com lances. Corrigido abaixo: só update, só enquanto
--     status = 'scheduled', sem nenhuma policy de delete;
--  4. casts explícitos ::numeric / ::timestamptz ao ler jsonb->>text (o
--     Postgres não faz esta conversão implicitamente neste contexto);
--  5. reaproveita a coluna marketplace_ads.type já existente (sem CHECK a
--     restringi-la) para o valor 'leilao' — não precisa de coluna nova;
--  6. toda a conversão de fuso-horário do <input type="datetime-local">
--     acontece no browser (ver bazar-ad-form.tsx), nunca no servidor com
--     manipulação de strings.

-- ------------------------------------------------------------
-- 1. Trigger: cria automaticamente a linha em marketplace_auctions
--    quando um anúncio do Gran Bazar é criado (ou editado) com type='leilao'
-- ------------------------------------------------------------
-- SECURITY DEFINER: o utilizador normal nunca tem (nem precisa de ter)
-- permissão de insert direto em marketplace_auctions — só este trigger
-- (que corre com privilégios do dono da função) é que escreve ali.
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
  if new.module <> 'gran-bazar' or new.type <> 'leilao' then
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

drop trigger if exists gran_bazar_create_auction_if_needed on public.marketplace_ads;
create trigger gran_bazar_create_auction_if_needed
  after insert or update of type, module on public.marketplace_ads
  for each row
  execute function public.gran_bazar_create_auction_if_needed();

-- ------------------------------------------------------------
-- 2. RLS: corrigir a policy do dono do leilão
-- ------------------------------------------------------------
-- A policy antiga ("Autores gerem os leiloes dos seus anuncios", for all,
-- sem restrição de estado) permitia ao autor alterar current_price,
-- status, winner_id, ou apagar o leilão em qualquer altura — incluindo já
-- com lances em curso ou depois de terminado. Substituída por uma policy
-- só de UPDATE, só enquanto o leilão ainda não começou (status =
-- 'scheduled'), e sem nenhuma policy de DELETE (o dono nunca pode apagar
-- um leilão diretamente).
drop policy if exists "Autores gerem os leiloes dos seus anuncios" on "public"."marketplace_auctions";

drop policy if exists "Autores atualizam leiloes agendados" on "public"."marketplace_auctions";
create policy "Autores atualizam leiloes agendados" on "public"."marketplace_auctions"
  for update
  to PUBLIC
  using (
    status = 'scheduled'
    and exists (
      select 1 from public.marketplace_ads
      where marketplace_ads.id = marketplace_auctions.ad_id
        and marketplace_ads.author_id = auth.uid()
    )
  )
  with check (
    status = 'scheduled'
    and exists (
      select 1 from public.marketplace_ads
      where marketplace_ads.id = marketplace_auctions.ad_id
        and marketplace_ads.author_id = auth.uid()
    )
  );

-- Sem policy de insert direto (a criação é sempre via trigger acima, que
-- corre como SECURITY DEFINER) nem de delete — RLS nega por omissão o que
-- não tiver policy explícita, por isso revogamos também os grants
-- correspondentes para utilizadores finais, deixando-os só para
-- manutenção administrativa.
revoke insert, delete on table "public"."marketplace_auctions" from "anon", "authenticated";

-- Bug encontrado ao ligar a UI a esta migration: a policy de select
-- original só deixava ver o leilão enquanto o anúncio estivesse
-- status='active'. Mas gran_bazar_advance_auctions() muda o anúncio para
-- 'sold' (houve vencedor) ou 'expired' (sem lances) exatamente quando o
-- leilão termina — com a policy antiga, a página do anúncio deixava de
-- conseguir mostrar o resultado final (vencedor, preço final) ao público
-- e ao próprio vencedor logo no momento em que isso passa a interessar.
-- Alargada para incluir esses dois estados; continua a esconder rascunhos
-- e leilões cancelados.
drop policy if exists "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions";
create policy "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions"
  for select
  to PUBLIC
  using (exists (
    select 1 from public.marketplace_ads
    where marketplace_ads.id = marketplace_auctions.ad_id
      and marketplace_ads.status = ANY (ARRAY['active'::text, 'sold'::text, 'expired'::text])
  ));

-- ------------------------------------------------------------
-- 3. Idempotência de lances: request_id + índice único parcial
-- ------------------------------------------------------------
-- Permite ao cliente reenviar o mesmo pedido (ex: timeout de rede, duplo
-- clique) sem risco de criar dois lances iguais — gran_bazar_place_bid()
-- usa isto abaixo.
alter table "public"."marketplace_auction_bids"
  add column if not exists "request_id" text;

create unique index if not exists idx_marketplace_auction_bids_request_id
  on public.marketplace_auction_bids (auction_id, bidder_id, request_id)
  where request_id is not null;

-- ------------------------------------------------------------
-- 4. place_bid(): a única forma válida de licitar
-- ------------------------------------------------------------
-- SECURITY DEFINER + "select ... for update" na linha do leilão: todo o
-- ciclo ler-validar-escrever acontece dentro da mesma transação com lock
-- de linha, nunca "ler no frontend, calcular, escrever" (essa abordagem
-- tem uma condição de corrida clássica entre dois lances em simultâneo).
create or replace function public.gran_bazar_place_bid(
  p_auction_id  bigint,
  p_amount      numeric,
  p_request_id  text default null
)
returns public.marketplace_auction_bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auction   public.marketplace_auctions%rowtype;
  v_ad        public.marketplace_ads%rowtype;
  v_bidder    uuid := auth.uid();
  v_min_valid numeric(10,2);
  v_bid       public.marketplace_auction_bids%rowtype;
begin
  if v_bidder is null then
    raise exception 'É necessário iniciar sessão para licitar' using errcode = '28000';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Lance inválido';
  end if;

  select * into v_auction
    from public.marketplace_auctions
    where id = p_auction_id
    for update;

  if not found then
    raise exception 'Leilão não encontrado';
  end if;

  select * into v_ad
    from public.marketplace_ads
    where id = v_auction.ad_id;

  if v_ad.author_id = v_bidder then
    raise exception 'Não podes licitar no teu próprio leilão';
  end if;

  -- auto-corrige o estado se o job de avanço (secção 5) ainda não correu
  -- mas o leilão já devia estar a decorrer
  if v_auction.status = 'scheduled' and v_auction.starts_at <= now() then
    update public.marketplace_auctions set status = 'live' where id = v_auction.id;
    v_auction.status := 'live';
  end if;

  if v_auction.status <> 'live' then
    raise exception 'Este leilão não está a decorrer (estado: %)', v_auction.status;
  end if;

  if now() >= v_auction.ends_at then
    raise exception 'Este leilão já terminou';
  end if;

  v_min_valid := v_auction.current_price + v_auction.minimum_increment;
  if p_amount < v_min_valid then
    raise exception 'O lance mínimo é % €', v_min_valid;
  end if;

  begin
    insert into public.marketplace_auction_bids (auction_id, bidder_id, amount, request_id)
    values (p_auction_id, v_bidder, p_amount, p_request_id)
    returning * into v_bid;
  exception
    when unique_violation then
      -- mesmo request_id já processado: devolve o lance já existente em
      -- vez de repetir ou falhar (retry idempotente do cliente)
      select * into v_bid
        from public.marketplace_auction_bids
        where auction_id = p_auction_id
          and bidder_id = v_bidder
          and request_id = p_request_id;
      return v_bid;
  end;

  update public.marketplace_auctions
    set current_price = p_amount
    where id = p_auction_id;

  return v_bid;
end;
$$;

revoke all on function public.gran_bazar_place_bid(bigint, numeric, text) from public;
grant execute on function public.gran_bazar_place_bid(bigint, numeric, text) to authenticated;

-- ------------------------------------------------------------
-- 5. gran_bazar_advance_auctions(): scheduled → live → ended
-- ------------------------------------------------------------
-- Não corre sozinha — precisa de ser chamada periodicamente (ex: pg_cron
-- se a extensão estiver disponível no projeto Supabase, ou uma rota de
-- API/edge function chamada por um cron externo a cada 1-2 minutos). Ver
-- nota entregue à parte com as instruções de agendamento.
create or replace function public.gran_bazar_advance_auctions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- scheduled → live
  update public.marketplace_auctions
    set status = 'live'
    where status = 'scheduled'
      and starts_at <= now();

  -- live → ended, com vencedor: maior "amount"; empate desempatado pelo
  -- lance mais antigo (created_at asc) — na prática não deve haver
  -- empates de valor porque cada lance tem de exceder estritamente o
  -- current_price anterior, mas mantém-se o desempate por segurança.
  update public.marketplace_auctions a
    set status = 'ended',
        winner_id = w.bidder_id
    from (
      select distinct on (b.auction_id) b.auction_id, b.bidder_id
      from public.marketplace_auction_bids b
      order by b.auction_id, b.amount desc, b.created_at asc
    ) w
    where a.id = w.auction_id
      and a.status = 'live'
      and a.ends_at <= now();

  -- live → ended, sem nenhum lance
  update public.marketplace_auctions
    set status = 'ended'
    where status = 'live'
      and ends_at <= now()
      and winner_id is null;

  -- reflete o resultado no anúncio: vendido (tem vencedor) ou expirado
  -- (ninguém licitou)
  update public.marketplace_ads ad
    set status = 'sold'
    from public.marketplace_auctions a
    where a.ad_id = ad.id
      and a.status = 'ended'
      and a.winner_id is not null
      and ad.status = 'active';

  update public.marketplace_ads ad
    set status = 'expired'
    from public.marketplace_auctions a
    where a.ad_id = ad.id
      and a.status = 'ended'
      and a.winner_id is null
      and ad.status = 'active';
end;
$$;

revoke all on function public.gran_bazar_advance_auctions() from public;
grant execute on function public.gran_bazar_advance_auctions() to service_role;
