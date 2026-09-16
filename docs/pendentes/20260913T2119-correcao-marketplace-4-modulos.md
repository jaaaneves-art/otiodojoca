# Marketplace — correção preparada para Gran Bazar, Mercado da Terra, Imóveis e Viaturas

13/09/2026, 21:19, Europe/Lisbon (WEST, UTC+1). Branch `fix/lup-rpc-20260913`.
Continuação de `docs/planos/20260913T2110-plano-reconciliacao-continuacao.md`,
opção escolhida pelo Yos: confirmar e corrigir os 4 módulos identificados no
plano das 17:49 como ainda com escrita direta.

## Confirmado por leitura de código (sem terminal, sem BD)

`app/gran-bazar/novo/page.tsx`, `app/gran-bazar/editar/[id]/page.tsx`,
`app/mercado-da-terra/novo/page.tsx`, `app/mercado-da-terra/editar/[id]/page.tsx`,
`app/mercado-da-terra/actions.ts`, `app/imoveis/novo/page.tsx`,
`app/imoveis/editar/[id]/page.tsx`, `app/viaturas/novo/page.tsx` e
`app/viaturas/editar/[id]/page.tsx` faziam todos `.from("marketplace_ads").insert()`
ou `.update()` diretos. Datas de modificação desses ficheiros (10/09–11/09)
confirmam que não foram tocados na correção RPC-only de hoje.

A migration `supabase/migrations/20260913180000_fechar_bypass_marketplace_ads.sql`
(aplicada hoje, resolvida no `PENDENTES-20260913.md` item 1b) revoga
`INSERT/UPDATE/DELETE/TRUNCATE` de `authenticated` em `marketplace_ads`. As
únicas escritas permitidas são as RPC `marketplace_ad_criar/_editar/_apagar`
(SECURITY DEFINER).

**Consequência: criar ou editar um anúncio em qualquer um destes 4 módulos
falha agora (RLS/grant) em qualquer ambiente onde essa migration esteja
aplicada** — não é uma hipótese, é o resultado direto de ler as duas
migrations e as 8 páginas lado a lado. Isto é uma regressão real introduzida
pela própria migration de segurança de hoje, tal como já tinha acontecido com
Empregos (ver `PENDENTES-20260913.md`, item 5) — o `Grep` de "nenhuma escrita
direta" desta vez também não cobriu estes 4 módulos.

## Porque não reutilizar `marketplace_ad_criar`/`marketplace_ad_editar`

Essa RPC (usada por retailing/beleza/mediação/consultório) nunca precisou de
`price`/`price_type`/`contact_method`/`type`/`module` — os comentários em
`lib/marketplace/retailing-actions.ts` confirmam isto. Gran Bazar, Mercado da
Terra, Imóveis e Viaturas precisam de poder **gravar `price`/`price_type` como
`null`** ao mudar de tipo de anúncio (ex.: venda → troca) — alargar a RPC
partilhada com `COALESCE(parâmetro, valor_atual)` (o padrão já usado para
`category_id`/`location`/`details`) impediria essa limpeza. Por isso, nova
função dedicada, no mesmo espírito de `lup_ad_guardar()` (20260913230000).

## Preparado, ainda NÃO aplicado nem testado

1. `supabase/migrations/20260913232000_marketplace_ad_completo_rpc.sql` —
   cria `marketplace_ad_criar_completo()` e `marketplace_ad_editar_completo()`,
   com todos os campos que os 4 módulos realmente usam (incluindo os 4
   `vehicle_*_id` de Viaturas, só na criação — a edição nunca os tocou, e a
   versão nova preserva isso de propósito).
2. As 8 páginas (`novo`/`editar` × 4 módulos) alteradas para chamar
   `supabase.rpc("marketplace_ad_criar_completo"/"marketplace_ad_editar_completo", ...)`
   em vez do INSERT/UPDATE direto. Upload de fotos e atualização de leilão
   (`marketplace_auctions`) não foram tocados — continuam diretos, tal como no
   LUP (mesma pendência de atomicidade, documentada, não resolvida aqui).

Nenhuma migration foi aplicada a nenhuma base de dados por esta sessão (sem
terminal/Supabase local disponível na ponte de ficheiros usada aqui). O
código das 8 páginas **não vai funcionar** enquanto a migration não for
aplicada — as duas alterações têm de avançar juntas.

## Validação necessária antes de commit/deploy (não feita aqui)

Mesmo procedimento já usado para o LUP: backup local
(`pg_dump -Fc`), aplicar a migration no Supabase local, e testar manualmente
ou por E2E, por módulo:

- Gran Bazar/Imóveis/Viaturas: criar e editar cada tipo de anúncio (incl.
  `leilao`, para confirmar que o trigger `gran_bazar_create_auction_if_needed`
  continua a disparar a partir da RPC — deve disparar, porque a RPC faz um
  INSERT/UPDATE normal, só que como `SECURITY DEFINER`); confirmar que mudar
  de tipo (ex.: venda → troca) limpa `price`/`price_type` corretamente.
- Viaturas: confirmar que criar um anúncio continua a preencher
  `vehicle_make_id`/`_model_id` (diretamente ou pelo trigger de catálogo, que
  lê de `details` quando estas colunas ficam `null`) e que editar não os
  apaga.
- Mercado da Terra: confirmar `module` a gravar corretamente como
  `'mercado-da-terra'` (antes vinha do valor por omissão da coluna; agora é
  explícito na RPC).
- Todos: dono vs. outro utilizador (RLS/ownership), `npm run lint`,
  `npx tsc --noEmit`, `npm run build`.

## Em aberto, não corrigido aqui

`app/mercado-da-terra/actions.ts` (`createAd`/`updateAd`, INSERT/UPDATE
direto) não foi alterado — não foi confirmado se algum ponto do código ainda
o importa/chama (`novo/page.tsx` e `editar/[id]/page.tsx` têm as suas próprias
ações inline, não importam este ficheiro). Verificar antes de decidir
apagá-lo ou corrigi-lo também.

## Estado

**Evolução** (diagnóstico confirmado e correção preparada), com bloqueio de
validação — precisa de terminal/Supabase local para aplicar e testar antes de
qualquer commit ou deploy.
