# Auditoria — motor de leilões OTJ (histórico de decisões e builds)

Data: 2026-08-22 a 2026-08-23
Âmbito: auditoria (2026-08-22 a 2026-08-23) seguida de implementação real (2026-08-23) — ver secção final "Implementado".

## Decisão final de mecanismo (2026-08-23): licitação ascendente simples

Confirmado pelo utilizador. Todos os pacotes de proxy bidding (máximo secreto) auditados desde então são descartados como base de integração, incluindo o mais recente (ver abaixo) — apesar da qualidade técnica, nenhum serve porque a tabela real `marketplace_auction_bids` só tem `amount`, sem máximo secreto.

## Builds descartados (resumo — ver histórico de versões do projeto para detalhe completo)

1-6. Motores de proxy bidding v0.2.0, v1.0-definitivo, auctionengine v0.1.0, auction_engine_code (vazio), pacote Prisma/Express/Redis, pacote "Gran Bazar anúncios" duplicado. Todos descartados.

## Pacote "Nível 4 — funcional" (schema real `marketplace_auctions`/`marketplace_auction_bids` + `place_bid()` ascendente simples) — CANDIDATO RECOMENDADO, AGORA IMPLEMENTADO

Foi o candidato usado como base. As 6 correções identificadas na auditoria foram todas aplicadas na implementação real (ver secção "Implementado" abaixo):
1. Migração não idempotente nas policies (falta `DROP POLICY IF EXISTS`). → Corrigido: todas as policies novas usam `drop policy if exists` + `create policy`.
2. `place_bid()` sem idempotência (`request_id`/`UNIQUE`). → Corrigido: coluna `request_id` + índice único parcial; função devolve o lance existente em caso de reenvio.
3. RLS `FOR ALL` do dono não restringe por `status`. → Corrigido: substituída por policy só de `UPDATE`, restrita a `status='scheduled'`, sem nenhuma policy de `DELETE`.
4. Falta cast `::numeric`/`::timestamptz` na trigger. → Corrigido: casts explícitos em todos os campos lidos de `details`.
5. Risco de colisão de nome no campo `type`. → Confirmado inofensivo e resolvido: `marketplace_ads.type` não tem CHECK, `'leilao'` é reaproveitado directamente, sem coluna nova.
6. Bug de fuso horário `datetime-local`. → Corrigido: conversão sempre via getters *locais* do `Date` no browser, nas duas direcções.

Bug adicional encontrado só ao ligar a UI (não estava na lista original): a policy de SELECT de `marketplace_auctions` só permitia ver o leilão enquanto `ad.status='active'` — mas `gran_bazar_advance_auctions()` muda o anúncio para `sold`/`expired` exactamente quando o leilão termina, o que escondia o resultado final (vencedor, preço) da página do anúncio no momento em que isso passa a interessar. Corrigido: policy alargada para `active`, `sold`, `expired`.

## Auditoria de `OTJ_Auction_System.zip` (2026-08-23) — testado a sério, não só lido

Ficheiros: `01_auction_schema.sql`, `02_auction-engine.ts`, `03_auction-actions.ts`, `04_auction-tests.ts`, `05_INTEGRACAO_OTJ.md`. Extraído, instalado `typescript`+`tsx`+`@types/node`, corrido `npx tsx 04_auction-tests.ts` e `npx tsc --noEmit`.

**Mecanismo**: proxy bidding (máximo secreto) outra vez — `bids.max_bid`, `winnerMaxBid`/`secondMaxBid`. Schema `auctions`/`bids`/`auction_events`/`auction_bidder_standing` é o **sétimo** desenho de tabelas diferente desta revisão, sem ligação a `marketplace_auctions`/`marketplace_auction_bids`. É, no entanto, o pacote de proxy bidding mais bem construído visto até agora: `place_bid_atomic()` tem `SELECT...FOR UPDATE` real, `UNIQUE(auction_id, idempotency_key)` para idempotência ao nível da BD, trata reserve price e anti-sniping. Guardar como referência caso o mecanismo seja reconsiderado no futuro; não serve para a decisão actual (ascendente simples).

**Resultado dos testes**: `npx tsx 04_auction-tests.ts` → 304 asserções passaram, 13 falharam.

- **12 das 13 falhas são um único bug de escrita no próprio ficheiro de testes**, repetido em vários blocos (`REGRA: Pagar apenas o necessário`, `REGRA: Incremento configurável`, `REGRA: Preço de reserva`, um caso-limite): a primeira chamada a `placeBid(...)` não é capturada/atribuída a `state` antes da segunda licitação, e como o motor é puro (devolve novo estado, não muta o argumento), a segunda licitação acaba avaliada como se fosse a primeira de sempre (preço fica preso em 5000 = preço inicial). Confirmado porque os mesmos cenários passam correctamente no bloco "CASO 2" mais acima no mesmo ficheiro, onde `state` É capturado correctamente. Bug do teste, não do motor.
- **1 falha aponta para um gap real no motor**: "Settle de auction active → erro" — `closeAuction()` marca sempre `status: "ended"` na saída, sem verificar se o leilão estava `active`/`paused` antes. Essa validação só existe no wrapper `closeAuctionServer` (03), não na função pura (02) — inconsistente com o resto do código.

**`tsc --noEmit` confirmou mais 2 bugs reais:**
- Dentro do próprio `02_auction-engine.ts`: `toPublicView()` tem `metadata` tipado via `Omit<PublicAuctionView, keyof AuctionState | ...>`, e como `AuctionState` já tem `sellerId`, esse campo é excluído do tipo de `metadata` também — a função nunca atribui `sellerId` em lado nenhum, por isso não consegue produzir o seu próprio tipo de retorno declarado (`tsc`: "Property 'sellerId' is missing"). Também tem `startTime: state.endTime, // placeholder` — bug deixado por resolver, já que `AuctionState` nem tem campo `startTime`.
- `03_auction-actions.ts` **não compila**: import com erro de escrita (`./02-auction-engine` com hífen vs. ficheiro real `02_auction-engine.ts` com underscore); tipo `PublicAuctionMetadata` usado/reexportado mas nunca definido; duas referências a `state.updatedAt` (campo inexistente em `AuctionState`); chamada `toPublicView(state, metadata, count ?? 0)` com 3 argumentos na ordem errada contra a assinatura real de 4 (`state, title, bidCount, metadata`).

**Recomendação seguida**: não usar `OTJ_Auction_System.zip` — mecanismo errado (proxy bidding), schema incompatível (8º desenho), camada de integração (03) nem compila.

## Implementado (2026-08-23)

Construção real no projecto (`/home/berze/Nextcloud/Projectos/otiodojoca`), aplicando o pacote "Nível 4" corrigido:

- **`supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql`** (novo): trigger `gran_bazar_create_auction_if_needed()` (cria a linha em `marketplace_auctions` a partir de `marketplace_ads.details` quando `type='leilao'`); RLS corrigida (UPDATE só `scheduled`, sem DELETE, SELECT alargado a `active`/`sold`/`expired`); coluna `request_id` + índice único parcial em `marketplace_auction_bids`; função `gran_bazar_place_bid()` (SECURITY DEFINER, `SELECT...FOR UPDATE`, idempotente); função `gran_bazar_advance_auctions()` (transições `scheduled→live→ended`, define `winner_id`, actualiza `marketplace_ads.status` para `sold`/`expired`) — **esta função não corre sozinha, precisa de ser agendada** (ver nota de instruções entregue ao utilizador: pg_cron no Supabase, ou uma rota de API chamada por um cron externo).
- **`lib/gran-bazar/ad-types.ts`**: `leilao` passou de conceito não-selecionável a tipo real, com campos `auctionStartPrice`/`auctionMinIncrement`/`auctionStartsAt`/`auctionEndsAt`.
- **`components/gran-bazar/bazar-ad-form.tsx`**: campos do leilão (com conversão de fuso horário correta nas duas direcções, sempre no browser); bloqueia edição dos parâmetros assim que o leilão deixa de estar `scheduled`.
- **`app/gran-bazar/novo/page.tsx`** e **`app/gran-bazar/editar/[id]/page.tsx`**: constroem o payload `details` na criação (lido pela trigger) e actualizam `marketplace_auctions` directamente na edição (gated por `status='scheduled'`, incluindo o caso de mudar o tipo do anúncio para "leilão" pela primeira vez durante uma edição).
- **`components/gran-bazar/auction-panel.tsx`** (novo): mostra lance atual, tempo restante, histórico de lances e formulário de licitar; chama o server action `placeBid`, nunca `supabase.rpc()` directamente do cliente (convenção do projecto).
- **`app/gran-bazar/leiloes/actions.ts`** (novo): server action `placeBid()`, único caminho de escrita de lances.
- **`app/gran-bazar/[id]/page.tsx`**: integra `AuctionPanel` quando `ad.type === 'leilao'`.
- **`app/gran-bazar/leiloes/page.tsx`**: deixou de ser "Em breve" — lista leilões agendados/em curso com link para a página do anúncio.
- **`app/gran-bazar/page.tsx`**: listagem principal passou a ir buscar `current_price`/`ends_at` dos leilões para os cartões (`BazarAdCard` já esperava isto e não estava a ser alimentado).
- **`docs/GRAN-BAZAR.md`**: secção "Leilões" reescrita de "Nível 3, o que falta" para "Nível 4, o que está pronto".

**Por fazer pelo utilizador** (fora do alcance desta sessão): aplicar a migration (`supabase db push` ou SQL manual no Studio) e agendar `gran_bazar_advance_auctions()` para correr periodicamente.
