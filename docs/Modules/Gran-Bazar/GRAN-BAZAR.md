# Gran Bazar — Arquitetura e Documentação Técnica

Módulo de marketplace/classificados comunitário do OTJ: venda, troca, oferta,
procura e leilões (licitação ascendente simples, em tempo real) de objetos.
Construído por cima da infraestrutura já existente do Mercado da Terra, não
em paralelo com ela.

## 1. Porque reutiliza o Mercado da Terra

Antes de escrever qualquer código foi feita uma auditoria à arquitetura
existente (rotas, tabelas, RLS, componentes, navegação, autenticação — ver
histórico de decisões nesta sessão). Concluiu-se que:

- `marketplace_ads` já é uma tabela genérica — sem nenhuma coluna
  específica de agricultura — com um `details jsonb` livre para dados por
  tipo de anúncio.
- `categories.type` já previa o valor `'marketplace'` ao lado de
  `forum`/`almanaque`/`general`, exatamente o ponto de extensão certo para
  um novo módulo.
- `marketplace_photos`, `marketplace_favorites` e o conjunto
  `marketplace_conversations`/`marketplace_messages`/
  `marketplace_message_attachments` já são completamente genéricos —
  ligados só por `ad_id`, sem qualquer acoplamento ao Mercado da Terra.

Por isso o Gran Bazar **não tem tabela de anúncios própria**. Reutiliza
`marketplace_ads` com uma nova coluna `module` a distinguir os dois
marketplaces, e reutiliza tal e qual fotos, favoritos e mensagens.

### Bug encontrado (não da responsabilidade do Gran Bazar, só documentado)

`marketplace_ads.category_id` tem uma foreign key real para
`public.categories(id)`, mas o Mercado da Terra (formulário, listagem)
lê e escreve a partir de uma tabela paralela `marketplace_categories`
(com o seu próprio `id`). Isto é uma inconsistência já existente em
produção — **não foi tocada** (o pedido era não alterar o que já
funciona sem necessidade). O Gran Bazar evita repetir o mesmo problema:
usa diretamente `categories` filtrado por `type = 'bazar'`, que é o FK
real da coluna.

## 2. Modelo de dados

### `marketplace_ads.module`
Nova coluna `text not null default 'mercado-da-terra'`, com CHECK
`module in ('mercado-da-terra', 'gran-bazar')`. Todas as linhas
existentes ficam automaticamente `'mercado-da-terra'` (default), sem
nenhuma migração de dados. Todas as queries de leitura do Mercado da
Terra foram atualizadas para filtrar explicitamente por
`module = 'mercado-da-terra'`, para que anúncios do Gran Bazar nunca
apareçam lá (e vice-versa) — ver secção 5.

### `marketplace_ads.status`
O CHECK existente (`active | sold | inactive`) foi ampliado para o
conjunto completo pedido, de forma aditiva (nenhum valor antigo deixou
de ser válido):

```
draft, active, reserved, sold, traded, given, expired, cancelled, inactive
```

### Categorias
`categories.type` ganhou o valor `'bazar'`. Foram inseridas 18
categorias iniciais (`bazar-casa`, `bazar-jardim`, ... `bazar-outros`),
com `on conflict (slug) do nothing` — a lista pode crescer só com
`insert`s adicionais, sem alterar nenhum código.

### Fotos, favoritos, mensagens
Sem alterações de esquema. `marketplace_photos`/`marketplace_favorites`/
`marketplace_conversations`/`marketplace_messages`/
`marketplace_message_attachments` são usadas tal e qual, só filtrando
por `ad_id` pertencente a anúncios com `module = 'gran-bazar'` onde faz
sentido (inbox de mensagens, "meus anúncios", favoritos).

### Storage
As fotos do Gran Bazar usam o mesmo bucket `marketplace-photos` já usado
pelo Mercado da Terra. Esse bucket **já existia em produção** mas tinha
sido criado manualmente no Supabase Studio — não havia nenhum SQL
versionado a defini-lo nem às suas RLS policies. A migration deste
módulo declara-o de forma idempotente (`on conflict do nothing` +
`drop policy if exists`), só para ficar reproduzível a partir de agora;
não apaga nem substitui nada que já lá estivesse. Vale a pena confirmar
no dashboard do Supabase se não ficaram policies antigas com nomes
diferentes, redundantes com as novas.

## 3. Leilões — o que está pronto

Classificação: **Nível 4 — funcional** (implementado em
`supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql`).
Mecanismo decidido explicitamente: **licitação ascendente simples** — cada
licitador escreve o valor exato que está disposto a pagar agora (não é
"proxy bidding" com valor máximo secreto; é por isto que
`marketplace_auction_bids` só tem uma coluna `amount`).

### Modelo de dados
- `marketplace_auctions`: `ad_id` (1:1 com um anúncio), `start_price`,
  `current_price`, `minimum_increment`, `starts_at`, `ends_at`,
  `status` (`scheduled | live | ended | cancelled`), `winner_id`.
- `marketplace_auction_bids`: histórico de lances (`auction_id`,
  `bidder_id`, `amount`, `created_at`, `request_id`), imutável — sem
  política de update/delete. `request_id` + índice único parcial dão
  idempotência a reenvios do cliente (timeout, duplo clique).

### Criação — trigger `gran_bazar_create_auction_if_needed()`
Ao criar (ou editar para) um anúncio com `type = 'leilao'` no Gran Bazar,
um trigger `AFTER INSERT OR UPDATE OF type, module` (SECURITY DEFINER) lê
`start_price`, `minimum_increment`, `starts_at`, `ends_at` de
`marketplace_ads.details` (com casts explícitos `::numeric`/
`::timestamptz` — o Postgres não converte implicitamente jsonb `->>` para
estes tipos) e cria a linha correspondente em `marketplace_auctions`. Só
corre uma vez por anúncio (verifica se já existe antes de inserir).

### Licitação — função `gran_bazar_place_bid()`
Única forma válida de licitar (chamada via `supabase.rpc(...)` a partir do
server action `app/gran-bazar/leiloes/actions.ts`, nunca com um simples
"ler o preço no frontend, calcular, escrever"). Faz `SELECT ... FOR
UPDATE` na linha do leilão dentro da mesma transação para evitar a
condição de corrida clássica de dois lances em simultâneo, e valida:
lance > `current_price + minimum_increment`; leilão com `status = 'live'`
e ainda dentro de `ends_at`; autor do anúncio não pode licitar no seu
próprio leilão (RLS de insert em `marketplace_auction_bids` já impedia
isto; a função repete a validação por defesa em profundidade).

### Avanço de estado — função `gran_bazar_advance_auctions()`
Transita `scheduled → live → ended`, define `winner_id` (maior `amount`,
desempate por `created_at` mais antigo) e reflete o resultado no anúncio
(`sold` se houve vencedor, `expired` se ninguém licitou). **Não corre
sozinha** — precisa de ser chamada periodicamente (pg_cron se a extensão
estiver disponível no projeto Supabase, ou uma rota de API/edge function
chamada por um cron externo a cada 1-2 minutos).

### RLS
A policy antiga do dono do leilão (`for all`, sem restrição de estado)
foi substituída por uma policy só de `UPDATE`, restrita a
`status = 'scheduled'` em `USING` e `WITH CHECK` — o autor só pode
ajustar os parâmetros do seu leilão antes de este começar, nunca depois
de ter lances em curso ou já ter terminado. Não há nenhuma policy de
`DELETE`: um leilão nunca pode ser apagado pelo autor.

### UI
- `components/gran-bazar/bazar-ad-form.tsx`: "Leilão" é um tipo
  selecionável como qualquer outro, com campos de preço inicial,
  incremento mínimo, início e encerramento (`<input
  type="datetime-local">`, convertido para/de ISO UTC sempre no browser
  via os getters *locais* do `Date` — nunca com slicing de string nem
  getters UTC, para não desalinhar a hora mostrada/submetida do fuso do
  utilizador). Em edição, estes campos ficam desativados assim que o
  leilão deixa de estar `scheduled`.
- `components/gran-bazar/auction-panel.tsx`: mostra o lance atual, tempo
  restante, histórico de lances, e o formulário de licitar (na página do
  próprio anúncio, `/gran-bazar/[id]`) — segue a convenção do projeto de
  um componente cliente a chamar um server action (`placeBid`), nunca
  `supabase.rpc(...)` diretamente do cliente.
- `/gran-bazar/leiloes`: lista os leilões agendados/em curso, cada um
  com link para a página do anúncio (onde se licita).

## 4. Rotas

```
/gran-bazar                     listagem (hero + pesquisa + tabs de modo + filtros)
/gran-bazar/[id]                detalhe do anúncio
/gran-bazar/novo                criar anúncio
/gran-bazar/editar/[id]         editar anúncio (só o autor)
/gran-bazar/meus-anuncios       os meus anúncios
/gran-bazar/favoritos           anúncios guardados
/gran-bazar/mensagens           caixa de entrada (só conversas de anúncios do Gran Bazar)
/gran-bazar/mensagens/[id]      conversa
/gran-bazar/leiloes             lista de leilões agendados/em curso (licitar acontece em /gran-bazar/[id])
```

## 5. Isolamento entre módulos

Como os dois módulos partilham `marketplace_ads` e as tabelas de
mensagens, foi necessário garantir que um não "vaza" para o outro.
Foram feitas alterações mínimas e aditivas (só acrescentar um filtro,
sem mudar mais nada) nos seguintes ficheiros já existentes do Mercado da
Terra:

- `app/mercado-da-terra/page.tsx` — listagem filtra por
  `module = 'mercado-da-terra'`.
- `app/mercado-da-terra/[id]/page.tsx` — detalhe idem (404 se o id
  pertencer a um anúncio do Gran Bazar).
- `app/mercado-da-terra/meus-anuncios/page.tsx` — idem.
- `app/mercado-da-terra/editar/[id]/page.tsx` — idem.
- `app/mercado-da-terra/messages/page.tsx` — caixa de entrada só mostra
  conversas de anúncios do Mercado da Terra.
- `app/mercado-da-terra/messages/[id]/page.tsx` — verifica o módulo do
  anúncio da conversa (defesa em profundidade).

Nenhuma destas alterações muda comportamento existente: como todas as
linhas atuais já ficam `module = 'mercado-da-terra'` pelo valor por
omissão da coluna, o filtro não esconde nada que já existisse — só
impede que anúncios futuros do Gran Bazar apareçam misturados.

## 6. Identidade visual

Paleta `bazar` nova em `tailwind.config.ts` (tons vivos de laranja/âmbar),
deliberadamente distinta da paleta `terra` (tons terrosos) do Mercado da
Terra. Componentes próprios em `components/gran-bazar/`, sem nenhuma
cópia visual do Mercado da Terra — só reutilização de peças utilitárias
genéricas (upload de imagens com recorte, autocomplete de município) que
não têm identidade visual de módulo.

## 7. Limitações conhecidas desta primeira versão

- Moderação (`PENDING_REVIEW`/`APPROVED`/`REJECTED`): não implementada —
  o pedido original permitia adiar isto, só pedindo para a arquitetura
  não a impedir. Como o `status` de `marketplace_ads` é texto livre
  validado só por CHECK (não é um enum fechado), acrescentar estes três
  estados no futuro é uma migração aditiva simples, sem alterar o
  modelo. Ainda não foi feita.
- Paginação: a listagem principal carrega todos os anúncios ativos do
  Gran Bazar de uma vez (mesmo comportamento que o Mercado da Terra já
  tinha). Com poucos anúncios não é um problema; deve ser revisitado
  (paginação ou infinite scroll) antes de um volume grande de anúncios.
- O esquema declarativo (`supabase/schemas/public/tables/*.sql`) não foi
  atualizado manualmente por este trabalho — segue a mesma convenção já
  usada nesta sessão para outras alterações: aplicar a migration
  primeiro, depois correr `supabase db pull --declarative` e commitar a
  sincronização do esquema à parte.
