# Viaturas (StandGo) — Arquitetura e Documentação Técnica

Módulo de venda e leilão de viaturas do OTJ, inspirado no mobile.de e no
MVP standalone **StandGo** (React + Vite, dados mock — ver
`docs/StandGo-PROMPT.md` e o zip original enviado pelo utilizador). Tal
como o Gran Bazar e o Lup antes dele, foi trazido para dentro da
plataforma e reconstruído sobre a infraestrutura já existente, em vez de
duplicado como site à parte.

Nome interno do módulo (rotas, `module`, categorias): **`viaturas`**.
Nome de marca mostrado na interface: **StandGo** — ver secção 5. Se
preferires outro nome de marca, é só texto (hero, navbar, título das
páginas); a arquitetura por baixo não muda.

## 1. Porque reutiliza a infraestrutura do Gran Bazar / Lup

Mesma decisão e mesma auditoria já feitas duas vezes antes (Gran Bazar,
depois Lup — ver `docs/GRAN-BAZAR.md` e `docs/LUP.md`): `marketplace_ads`
é uma tabela genérica, com um `details jsonb` livre por tipo de anúncio,
já estendida com uma coluna `module` para distinguir marketplaces.
`marketplace_photos`, `marketplace_favorites` e o conjunto
`marketplace_conversations`/`marketplace_messages`/
`marketplace_message_attachments` são completamente genéricos, ligados só
por `ad_id`. Por isso Viaturas, tal como o Gran Bazar e o Lup antes dele,
**não tem tabela de anúncios própria** — é só mais um valor de `module`.

A diferença desta vez: Viaturas **quer leilão** (venda direta + leilão,
pedido explícito), ao contrário do Lup (que decidiu deliberadamente não
ter leilão). Isto é a primeira vez que um segundo módulo reaproveita o
motor de leilões construído para o Gran Bazar
(`supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql`) — ver
secção 3.

## 2. Modelo de dados

### `marketplace_ads.module`
`'viaturas'` acrescentado ao CHECK já existente (`'mercado-da-terra'`,
`'gran-bazar'`, `'lup'`), de forma aditiva — ver
`supabase/migrations/20260824000000_viaturas.sql`.

### Categorias
`categories.type` ganhou o valor `'viaturas'`, com 7 categorias iniciais
(`viaturas-ligeiros`, `viaturas-comerciais`, `viaturas-motociclos`,
`viaturas-caravanas`, `viaturas-reboques`, `viaturas-pecas`,
`viaturas-outros`) — pode crescer no futuro só com inserts adicionais
(`on conflict (slug) do nothing`), à semelhança do Gran Bazar.

### Tipos de anúncio (`lib/viaturas/ad-types.ts`)
Só 2, deliberadamente mais simples que o Gran Bazar (que tem
venda/troca/oferta/procura/leilão) — pedido explícito do utilizador foi
"venda direta + leilão", sem troca nem oferta:

- **`venda`** — venda direta, preço fixo ou negociável.
- **`leilao`** — leilão (reaproveita o motor do Gran Bazar tal e qual —
  ver secção 3).

### Campos específicos de Viaturas, dentro de `details` (jsonb)
Nenhuma tabela nova — tudo em `marketplace_ads.details`, tal como o Gran
Bazar guarda os parâmetros do leilão lá e o Lup guarda `quantity`/`unit`:

- `marca`, `modelo` (texto) — obrigatórios.
- `ano` (inteiro) — obrigatório.
- `quilometros` (inteiro) — obrigatório.
- `combustivel` (Gasolina/Gasóleo/Híbrido/Elétrico/GPL) — obrigatório.
- `caixa` (Manual/Automática) — obrigatório.
- `condicao` (Novo/Usado) — obrigatório.
- `cor` (texto) — opcional.
- `potencia` (cv, inteiro) — opcional.
- `tipo_vendedor` (Particular/Stand) — opcional, mostrado como badge
  "STAND" no cartão quando aplicável (pedido de design do MVP StandGo
  original).
- Quando `type = 'leilao'`: os mesmos 4 campos do leilão do Gran Bazar —
  `start_price`, `minimum_increment`, `starts_at`, `ends_at` — lidos pelo
  mesmo trigger `gran_bazar_create_auction_if_needed()` (ver secção 3).

Todos os campos numéricos ficam gravados como texto dentro do jsonb (tal
como o Gran Bazar já fazia com os campos do leilão) — a leitura no
frontend converte com `Number(...)` onde for preciso comparar/ordenar.

### Fotos, favoritos, mensagens, storage
Sem alterações de esquema — reutilizados tal e qual, incluindo o bucket
`marketplace-photos` já declarado pela migration do Gran Bazar.

## 3. Leilões — reaproveitamento direto do motor do Gran Bazar

**Nenhuma tabela nova, nenhuma função nova.** `marketplace_auctions` e
`marketplace_auction_bids`, `gran_bazar_place_bid()` e
`gran_bazar_advance_auctions()` são usados tal e qual — nunca filtram por
`module` (só por `ad_id`/`auction_id`), por isso já funcionavam para
qualquer módulo sem alteração nenhuma.

A única peça que precisou de mudar foi
`gran_bazar_create_auction_if_needed()` (o trigger que cria a linha em
`marketplace_auctions` quando um anúncio é publicado com `type='leilao'`):
tinha uma guarda `if new.module <> 'gran-bazar' ...` que bloqueava
qualquer outro módulo. A migration `20260824000000_viaturas.sql` substitui
essa função (`create or replace`, mesmo nome, mesmo trigger já existente)
por uma versão que aceita `module in ('gran-bazar', 'viaturas')` — o resto
da lógica fica byte a byte igual. O nome da função manteve-se
`gran_bazar_create_auction_if_needed` de propósito (menor raio de
mudança — não obriga a recriar o trigger nem a re-explicar a função no
resto da documentação do Gran Bazar).

Isto significa que **licitação ascendente simples**, idempotência de
lances, `SELECT ... FOR UPDATE`, RLS do autor restrita a
`status = 'scheduled'`, e o avanço `scheduled → live → ended` via
`gran_bazar_advance_auctions()` (o mesmo cron/job já agendado para o Gran
Bazar) — tudo isto já funciona para Viaturas sem código adicional.
**Confirma que `gran_bazar_advance_auctions()` continua agendada** (o
mesmo job já cobre os dois módulos, porque a função nunca filtrou por
module).

### UI
- `components/viaturas/viatura-ad-form.tsx`: campos de viatura +
  parâmetros do leilão quando `type = 'leilao'`, mesma disciplina de
  conversão de fuso-horário do `bazar-ad-form.tsx` original (getters
  *locais* do `Date`, sempre no browser).
- `components/viaturas/auction-panel.tsx`: cópia fina do
  `auction-panel.tsx` do Gran Bazar, só a apontar para
  `app/viaturas/leiloes/actions.ts` (que chama a mesma RPC
  `gran_bazar_place_bid`).
- `components/viaturas/auction-countdown-badge.tsx`: cópia com as cores
  `viaturas-*` em vez de `bazar-*` (é a única peça do relógio de contagem
  com identidade visual — a lógica em si, `lib/gran-bazar/auction-
  countdown.ts`, é genuinamente genérica e é reutilizada tal e qual, sem
  cópia).
- `/viaturas/leiloes`: lista os leilões agendados/em curso deste módulo.

## 4. Rotas

```
/viaturas                     listagem (hero + pesquisa + filtros de viatura)
/viaturas/[id]                detalhe do anúncio
/viaturas/novo                criar anúncio (venda ou leilão)
/viaturas/editar/[id]         editar anúncio (só o autor)
/viaturas/meus-anuncios       os meus anúncios
/viaturas/favoritos           anúncios guardados
/viaturas/mensagens           caixa de entrada (só conversas de anúncios de Viaturas)
/viaturas/mensagens/[id]      conversa
/viaturas/leiloes             lista de leilões agendados/em curso
```

## 5. Isolamento entre módulos

Todas as queries de leitura de Viaturas filtram explicitamente por
`module = 'viaturas'` (listagem, detalhe, meus-anúncios, favoritos,
mensagens) — mesma disciplina já aplicada pelo Gran Bazar e pelo Lup, para
não vazar entre módulos. Como as quatro coleções de `module` são
mutuamente exclusivas por CHECK, um anúncio nunca pode aparecer em mais do
que um módulo.

## 6. Identidade visual

Paleta `viaturas` nova em `tailwind.config.ts` — azul (`#2563eb`) +
tons de slate, seguindo os requisitos de design do MVP StandGo original
(deliberadamente distinta de `terra`, `bazar` e `lup`). Componentes
próprios em `components/viaturas/`, reutilizando só peças verdadeiramente
genéricas sem identidade de módulo (upload de imagens, autocomplete de
município, e a lógica — não o badge visual — do relógio de contagem dos
leilões).

Marca mostrada na interface: **StandGo** (hero da listagem, navbar). Nome
técnico do módulo/rota: `viaturas`. Fácil de trocar um pelo outro depois,
se preferires — está tudo concentrado num punhado de strings, não afeta o
modelo de dados.

## 7. Diferenças deliberadas face ao Gran Bazar

- **Só 2 tipos de anúncio** (venda, leilão) — sem troca nem oferta, que
  não fazem sentido para viaturas.
- **Campos de viatura fixos** no formulário (marca, modelo, ano, km,
  combustível, caixa, condição, cor, potência) em vez do formulário
  genérico do Gran Bazar.
- **Categorias por tipo de viatura** (ligeiros, comerciais, motociclos,
  caravanas, reboques, peças, outros) em vez de categorias genéricas de
  bazar.

## 8. Limitações conhecidas desta primeira versão

- Moderação: não implementada, mesma situação que o Gran Bazar e o Lup.
- Paginação: a listagem carrega todos os anúncios ativos de uma vez, mesma
  decisão pragmática já tomada nos outros módulos.
- Sem pesquisa por raio/distância nem histórico de preços (roadmap do MVP
  StandGo original, não implementado nesta primeira versão).
- Filtros avançados (marca, ano, km máximo, combustível, caixa) filtram no
  cliente/URL da mesma forma que o Gran Bazar — sem índices dedicados em
  `details` (jsonb) para já; se o volume de anúncios crescer muito, vale a
  pena reavaliar (índice GIN em `details`, ou promover `marca`/`ano` a
  colunas reais).
- `gran_bazar_advance_auctions()` precisa de continuar agendada (pg_cron
  ou cron externo) para os leilões de viaturas avançarem de estado — é a
  mesma função já em uso pelo Gran Bazar, não precisa de um segundo
  agendamento.
