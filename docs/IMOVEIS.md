# Imóveis — Arquitetura e Documentação Técnica

Módulo de marketplace de imóveis: venda direta e leilão de apartamentos,
moradias, terrenos, lojas, armazéns, escritórios, quintas e garagens.

Nasceu da auditoria a um prompt externo + MVP React "Lup Imóveis" (ver
`claude/AUDITORIA-LUP-IMOVEIS-20260824.md` no projeto Claude) que propunha
tabelas `properties`/`property_auctions`/`property_auction_bids` novas e um
motor de leilão próprio, client-side, sem lock de linha — repetindo tanto a
duplicação de arquitetura que o Gran Bazar e o Lup já tinham decidido
evitar, como os bugs de condição de corrida já corrigidos no motor de
leilões do Gran Bazar. Trazido para dentro da plataforma e reconstruído
sobre a infraestrutura já existente, tal como o Gran Bazar e o Lup fizeram
antes dele.

## 0. Porque "Imóveis" e não "Lup Imóveis"

O material de origem chamava-se "Lup Imóveis", mas `'lup'` já é o módulo de
economia circular/excedentes (doação e venda simbólica de comida —
completamente sem relação com imóveis). Usar o mesmo prefixo de marca para
um domínio diferente só criaria confusão entre os dois módulos. Decisão
tomada com o Yos: módulo próprio, sem o prefixo "Lup" — só **Imóveis**.

## 1. Porque reutiliza o Gran Bazar / Mercado da Terra

Mesma decisão e mesma auditoria já feitas para o Gran Bazar e o Lup (ver
`docs/GRAN-BAZAR.md`, `docs/LUP.md`): `marketplace_ads` é uma tabela
genérica, com um `details jsonb` livre por tipo de anúncio, distinguida por
`module`. `marketplace_photos`, `marketplace_favorites` e o conjunto
`marketplace_conversations`/`marketplace_messages`/
`marketplace_message_attachments` são completamente genéricos, ligados só
por `ad_id`. Por isso o módulo Imóveis, tal como o Gran Bazar e o Lup antes
dele, **não tem tabela de anúncios própria** — é só mais um valor de
`module`.

Porque este módulo tem leilão, também reutiliza — sem alterar a lógica —
`marketplace_auctions`/`marketplace_auction_bids` e o mecanismo de
licitação já construído, auditado e corrigido para o Gran Bazar
(`gran_bazar_place_bid()`, `gran_bazar_advance_auctions()` — ver
`claude/AUDITORIA-AUCTION-ENGINE-V0.2.0.md`). Nenhuma das duas funções
filtra por `module`; já eram genéricas. O único ponto que precisou de
alteração foi o trigger que cria a linha em `marketplace_auctions` a partir
de `marketplace_ads.details`, que tinha `module = 'gran-bazar'` a bloquear
qualquer outro módulo — alargado para uma allowlist explícita
(`gran-bazar`, `imoveis`) em vez de aceitar qualquer módulo, para não
ativar leilão sem querer em `mercado-da-terra` ou `lup`.

## 2. Modelo de dados

### `marketplace_ads.module`
`'imoveis'` acrescentado ao CHECK já existente (`'mercado-da-terra'`,
`'gran-bazar'`, `'lup'`, `'viaturas'`), de forma aditiva — ver
`supabase/migrations/20260824010000_imoveis.sql`.

### `marketplace_ads.status`
Sem alterações — o CHECK já amplo (`draft, active, reserved, sold, traded,
given, expired, cancelled, inactive`) cobre o ciclo de vida de um anúncio
de imóvel: `sold` para venda concluída ou leilão com vencedor, `expired`
para leilão sem lances.

### Categorias — tipo de imóvel
`categories.type` ganhou o valor `'imoveis'`, com 9 categorias fixas — o
"tipo de imóvel" do MVP original mapeado diretamente para `category_id`,
ortogonal a `marketplace_ads.type` (que aqui só distingue venda/leilão),
exatamente como o Gran Bazar usa categoria para o tipo de artigo:

| slug                    | nome         | ícone |
|-------------------------|--------------|-------|
| `imoveis-apartamento`   | Apartamento  | 🏢    |
| `imoveis-moradia`       | Moradia      | 🏡    |
| `imoveis-terreno`       | Terreno      | 🌳    |
| `imoveis-loja`          | Loja         | 🏬    |
| `imoveis-armazem`       | Armazém      | 🏭    |
| `imoveis-escritorio`    | Escritório   | 💼    |
| `imoveis-quinta`        | Quinta       | 🚜    |
| `imoveis-garagem`       | Garagem      | 🚗    |
| `imoveis-outro`         | Outro        | 📦    |

### Tipos de anúncio (`lib/imoveis/ad-types.ts`)
Só 2, deliberadamente mais simples que o Gran Bazar — sem troca, oferta nem
procura, que não fazem sentido para um imóvel dentro do âmbito pedido (ver
`claude/AUDITORIA-LUP-IMOVEIS-20260824.md`, "não inventar funcionalidades
fora do âmbito"):

- **`venda`** — preço fixo ou negociável.
- **`leilao`** — reaproveita a coluna `marketplace_ads.type` já existente
  (sem CHECK a restringir valores). Ver secção 3.

### Campos do imóvel, dentro de `details` (jsonb)
Nenhuma tabela nova — tudo em `marketplace_ads.details`, tal como o Gran
Bazar guarda os parâmetros do leilão lá e o Lup guarda quantidade/peso.
Ao contrário dos campos de leilão (só existem quando `type='leilao'`), os
campos do imóvel aplicam-se **sempre**, independentemente do tipo de
anúncio — um imóvel em leilão continua a ter área e quartos:

- `area` (obrigatório) — m².
- `bedrooms`, `bathrooms`, `year_built` (opcionais).
- `condition` (obrigatório) — `novo` | `usado` | `remodelado` |
  `em_construcao`.

Quando `type='leilao'`, o mesmo objeto `details` acrescenta também
`start_price`, `minimum_increment`, `starts_at`, `ends_at` — lidos pelo
trigger `gran_bazar_create_auction_if_needed` (ver secção 3). A construção
deste objeto está centralizada em `lib/imoveis/details.ts`
(`buildImovelDetails()`), usada tanto na criação como na edição, para as
duas produzirem exatamente o mesmo payload.

### Localização
Texto livre em `marketplace_ads.location`, preenchido através do mesmo
`MunicipioAutocomplete` (`components/mercado-da-terra/municipio-autocomplete.tsx`)
que o Gran Bazar e o Mercado da Terra já usam — reutilizado tal e qual, sem
nenhum componente próprio do módulo. **Nota**: a auditoria inicial
(`claude/AUDITORIA-LUP-IMOVEIS-20260824.md`) tinha equacionado uma FK para
uma tabela `localizacoes`/código postal (padrão usado pelo módulo
Alojamento), mas o padrão real e já estabelecido para anúncios de
marketplace (Gran Bazar, Mercado da Terra) é este autocomplete + texto
livre — seguido aqui por consistência com os módulos irmãos, não com o
Alojamento.

### Fotos, favoritos, mensagens, leilões, storage
Sem alterações de esquema além do trigger de leilão (secção 3):
`marketplace_photos`, `marketplace_favorites`,
`marketplace_conversations`/`marketplace_messages`/
`marketplace_message_attachments`, `marketplace_auctions`/
`marketplace_auction_bids`, `gran_bazar_place_bid()`,
`gran_bazar_advance_auctions()` e o bucket `marketplace-photos` já existem
e já são genéricos — reutilizados tal e qual.

## 3. Leilões

Reaproveita por completo o motor "Nível 4" do Gran Bazar
(`supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql`):
licitação ascendente simples (sem proxy bidding), `gran_bazar_place_bid()`
como função `SECURITY DEFINER` com `SELECT ... FOR UPDATE` (sem condição de
corrida entre lances simultâneos), idempotência via `request_id`, RLS do
dono restrita a `status='scheduled'` sem `DELETE`, e
`gran_bazar_advance_auctions()` para as transições
`scheduled → live → ended` (precisa de ser chamada periodicamente — ver
secção 7 "Por fazer").

A única alteração de código para suportar Imóveis foi alargar o trigger
`gran_bazar_create_auction_if_needed()` (que cria a linha em
`marketplace_auctions` a partir de `marketplace_ads.details` quando
`type='leilao'`) para aceitar `module IN ('gran-bazar', 'imoveis')` em vez
de só `'gran-bazar'`. Todo o resto — a função de licitar, a de avançar
estado, as RLS de `marketplace_auctions`/`marketplace_auction_bids` — já
era genérico e não precisou de nenhuma alteração.

`app/imoveis/leiloes/actions.ts` (`placeBid`) chama
`supabase.rpc("gran_bazar_place_bid", ...)` — o nome da função Postgres
continua com o prefixo histórico "gran_bazar" mas é, na prática, um RPC
genérico partilhado entre módulos; documentado no código para não confundir
sessões futuras.

## 4. Rotas

```
/imoveis                      listagem (hero + pesquisa + tabs venda/leilão)
/imoveis/[id]                 detalhe do imóvel (+ painel de leilão quando aplicável)
/imoveis/novo                 publicar imóvel
/imoveis/editar/[id]          editar imóvel (só o autor)
/imoveis/leiloes              listagem só de leilões de imóveis
/imoveis/meus-anuncios        os meus imóveis
/imoveis/favoritos            imóveis guardados
/imoveis/mensagens            caixa de entrada (só conversas de imóveis)
/imoveis/mensagens/[id]       conversa
```

## 5. Isolamento entre módulos

Todas as queries de leitura do módulo Imóveis filtram explicitamente por
`module = 'imoveis'` (listagem, detalhe, meus-anúncios, mensagens, leilões
— mesma disciplina que o Gran Bazar e o Lup já aplicavam) para não vazar
para os outros módulos e vice-versa.

## 6. Identidade visual

Paleta `imoveis` nova em `tailwind.config.ts` — índigo, deliberadamente
distinta de `terra` (castanho, Mercado da Terra), `bazar` (laranja, Gran
Bazar), `lup` (verde, economia circular) e `viaturas` (azul, StandGo).
Componentes próprios em `components/imoveis/`, reutilizando só peças
utilitárias genéricas sem identidade de módulo (`ImageUpload`,
`MunicipioAutocomplete` — as mesmas que os outros módulos já usam) e a
lógica de contagem decrescente de leilão (`lib/gran-bazar/auction-countdown.ts`,
importada diretamente em vez de duplicada — é lógica pura de tempo, sem
nada específico de paleta).

## 7. Limitações conhecidas desta primeira versão

- **Build não confirmado.** Esta sessão só tem leitura/escrita de ficheiros
  no computador ligado, não um terminal nesse computador — por isso não foi
  possível correr `npm run build`/`tsc --noEmit` no projeto real. Os
  ficheiros novos foram verificados sintaticamente (esbuild, fora do
  projeto) e por inspeção cruzada de imports/exports, mas isso não
  substitui uma compilação real. Ver `docs/pendentes/RELATORIO-IMOVEIS-20260824.md`.
- **Migração por aplicar.** `supabase/migrations/20260824010000_imoveis.sql`
  precisa de `supabase db push` (ou SQL manual no Studio).
- **Sem teste manual do fluxo completo.** Publicar um imóvel de venda e um
  de leilão, licitar com uma segunda conta, confirmar que o
  `gran_bazar_advance_auctions()` (já agendado no `pg_cron` para o Gran
  Bazar, segundo `claude/RELATORIO-LEILOES-GRAN-BAZAR-20260823.md`) fecha
  também os leilões de imóveis corretamente — nada nessa função filtra por
  módulo, por isso deve funcionar sem alteração, mas não foi confirmado ao
  vivo.
- **Moderação**: não implementada — mesma situação que os outros módulos.
- **Paginação**: a listagem carrega todos os imóveis ativos de uma vez,
  mesma decisão pragmática dos outros módulos.
- **Sem arrendamento.** Só venda e leilão, por ser o âmbito pedido — um
  tipo de anúncio "arrendamento" seria uma extensão aditiva natural (mais
  um valor em `lib/imoveis/ad-types.ts`) se vier a ser pedido.
