# Relatório — Módulo Imóveis (venda + leilão)

**Data:** 24 de agosto de 2026 às 13:04
**Sessão:** Criação do módulo Imóveis a partir da auditoria ao prompt+MVP "Lup Imóveis"

---

## 1. O que foi pedido

"Implementar seguindo a recomendação" — a recomendação sendo a de
`claude/AUDITORIA-LUP-IMOVEIS-20260824.md` (auditoria feita antes desta
sessão a um prompt externo + MVP React "Lup Imóveis", que propunha tabelas
`properties`/`property_auctions`/`property_auction_bids` novas e um motor
de leilão próprio no cliente): reaproveitar `marketplace_ads`,
`marketplace_auctions`/`marketplace_auction_bids`, `marketplace_photos` e
`localizacoes`/localização já existentes, em vez de duplicar.

Decisões tomadas contigo antes de começar (via perguntas diretas):
- Módulo próprio (como o Gran Bazar/Lup), não uma categoria dentro do Gran
  Bazar.
- Nome: **Imóveis**, sem o prefixo "Lup" — porque `'lup'` já é o módulo de
  economia circular/excedentes (SobraCiclo), e usar o mesmo prefixo de
  marca para um domínio diferente só criaria confusão.

## 2. O que foi feito

Auditoria ao código real do Gran Bazar e do Lup (migrations, `lib/`,
`components/`, `app/`, `docs/`) para replicar o mesmo padrão — reaproveitar
tudo o que já existe, duplicar só o que tem de ser visualmente próprio
(paleta, componentes) — e criação de 24 ficheiros novos + 2 editados,
acedidos e escritos diretamente na tua pasta local via a ligação ao
computador (não passaram por git/GitHub):

- **`supabase/migrations/20260824010000_imoveis.sql`** (novo) — acrescenta
  `'imoveis'` ao CHECK de `marketplace_ads.module` e ao CHECK de
  `categories.type`; insere as 9 categorias fixas (tipos de imóvel).
  Alarga o trigger `gran_bazar_create_auction_if_needed()` (que cria a
  linha em `marketplace_auctions` a partir de `marketplace_ads.details`)
  para aceitar `module IN ('gran-bazar', 'imoveis')` em vez de só
  `'gran-bazar'` — é a única alteração de código que o motor de leilões
  precisou; `gran_bazar_place_bid()` e `gran_bazar_advance_auctions()` já
  eram genéricas (não filtram por módulo) e não foram tocadas. Sem tabelas
  novas.
- **`lib/imoveis/ad-types.ts`** — 2 tipos de anúncio (`venda`, `leilao`) e
  os campos do imóvel (área, quartos, WC, ano, estado), que se aplicam aos
  dois tipos por igual (um imóvel em leilão continua a ter área e quartos)
  — ao contrário dos campos de leilão, que só existem quando `type='leilao'`.
- **`lib/imoveis/details.ts`** — `buildImovelDetails()`, centraliza a
  construção do `details` (jsonb) para a criação e a edição produzirem
  exatamente o mesmo payload.
- **`components/imoveis/`** — navbar, filtros (tabs venda/leilão), cartão
  de imóvel, formulário (com características do imóvel + parâmetros de
  leilão condicionais), painel de leilão, badge de contagem decrescente,
  botão de favorito, formulário de contacto, formulário de mensagem. O
  painel de leilão e o badge são cópias com paleta própria do Gran Bazar —
  a lógica de tempo (`useAuctionCountdown`) é importada diretamente de
  `lib/gran-bazar/auction-countdown.ts` em vez de duplicada, por ser
  puramente lógica, sem nada específico de módulo.
- **`app/imoveis/`** — listagem, `[id]`, `novo`, `editar/[id]`, `leiloes`
  (+ actions), `meus-anuncios`, `favoritos` (+ actions), `mensagens` (+
  actions + `[id]`).
- **`tailwind.config.ts`** — nova paleta `imoveis` (índigo), ao lado de
  `terra`, `bazar`, `lup` e `viaturas`.
- **`app/page.tsx`** — link de navegação + `FeatureCard` para `/imoveis`.
- **`docs/IMOVEIS.md`** — documentação técnica completa, no mesmo formato
  de `docs/GRAN-BAZAR.md`/`docs/LUP.md`.

### O que foi deliberadamente deixado de fora do prompt original

- Tabelas `properties`/`property_auctions`/`property_auction_bids` — não
  criadas; tudo vive em `marketplace_ads`/`marketplace_auctions` já
  existentes.
- Localização como colunas de texto livre (`country`/`district`/
  `municipality`/`parish`) — usa antes o mesmo `location` + autocomplete de
  município que o Gran Bazar já usa.
- Imagens em `images jsonb` na própria tabela — usa `marketplace_photos` +
  bucket `marketplace-photos` já existentes.
- Serviço de licitar client-side (`propertyAuctionService.placeBid()` do
  prompt original, com leitura-validação-escrita sem lock) — usa antes
  `gran_bazar_place_bid()` (SECURITY DEFINER + lock de linha, já auditado e
  corrigido para o Gran Bazar).
- Troca, oferta e procura como tipos de anúncio — só venda e leilão, por
  ser o âmbito pedido.

## 3. Verificação feita nesta sessão (e os seus limites)

Esta sessão só tem leitura/escrita de ficheiros no teu computador através
da ligação ao desktop, **não um terminal nesse computador** — a mesma
limitação já registada em `docs/pendentes/RELATORIO-LUP-20260823.md`. Não
foi possível correr `npm run build` nem `tsc --noEmit` no projeto real.

O que foi possível verificar, num sandbox à parte (sem o projeto real, só
os ficheiros novos):
- **Sintaxe válida** — os 25 ficheiros `.ts`/`.tsx` novos ou editados
  passaram por `esbuild` (parser TypeScript/JSX) sem nenhum erro.
- **Imports/exports cruzados consistentes** — todos os `import { X } from
  "@/..."` que apontam para ficheiros deste módulo foram confirmados contra
  os `export`/`export default` reais desses ficheiros (nomes e caminhos).
- **Migration lida com atenção** à sintaxe Postgres (`<> ALL(ARRAY[...])`
  para "não está nesta lista", equivalente a `NOT IN`) e ao facto de as
  RLS de `marketplace_auctions`/`marketplace_auction_bids` já não
  filtrarem por módulo — por isso não precisaram de nenhuma alteração.

O que **não** foi verificado e fica pendente:
1. **`npm run build` / `tsc --noEmit` no projeto real** — os ficheiros
   novos podem compilar sem erros isoladamente e ainda assim colidir com
   tipos reais do projeto (ex: a forma exata do cliente Supabase gerado,
   props de `ImageUpload`/`MunicipioAutocomplete`, tipos de
   `next/navigation`) que este sandbox não tinha para verificar.
2. **Aplicar a migração** — `supabase db push` (ou SQL manual no Studio).
3. **Testar o fluxo completo**: publicar um imóvel de venda e um de
   leilão, licitar com uma segunda conta, confirmar que aparecem
   corretamente filtrados, testar favoritos e mensagens, confirmar que
   imóveis não aparecem no Gran Bazar/Lup/Mercado da Terra e vice-versa, e
   confirmar que o `gran_bazar_advance_auctions()` já agendado no
   `pg_cron` (para o Gran Bazar) fecha também leilões de imóveis — não
   filtra por módulo, por isso deve funcionar sem alteração nenhuma no
   agendamento, mas não foi confirmado ao vivo.

## 4. Por fazer (imediato, para a próxima sessão ou para ti)

1. Correr `npm run build` (ou `npm run dev` e navegar a `/imoveis`) e
   corrigir o que aparecer — é o primeiro passo real de validação que esta
   sessão não conseguiu dar.
2. Aplicar a migração `20260824010000_imoveis.sql`.
3. Testar o fluxo descrito no ponto 3 da secção anterior.
4. Confirmar visualmente a paleta índigo (`imoveis-*`) — é nova, escolhida
   para ficar distinta das outras quatro, mas não foi vista a correr.

## 5. Estado

Código do módulo Imóveis: **escrito e gravado**, arquitetura consistente
com o Gran Bazar e o Lup, documentado em `docs/IMOVEIS.md`. **Build ainda
não confirmado no projeto real** — só verificação sintática isolada (ver
secção 3). Migração por aplicar.
