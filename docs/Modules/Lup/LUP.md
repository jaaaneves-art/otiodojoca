# Lup — Arquitetura e Documentação Técnica

Módulo de economia circular / excedentes do OTJ: doação, venda simbólica
e procura de recursos em excesso — comida (ou outros bens perecíveis)
para consumo humano, alimentação animal, ou compostagem. "Zero
desperdício, três ciclos."

Nasceu a partir do MVP standalone **SobraCiclo** (React + Vite, dados
mock, inspirado no TooGoodToGo), trazido para dentro da plataforma e
reconstruído sobre a infraestrutura já existente, tal como o Gran Bazar
fez antes dele.

## 1. Porque reutiliza o Mercado da Terra / Gran Bazar

Mesma decisão e mesma auditoria que já tinham sido feitas para o Gran
Bazar (ver `docs/GRAN-BAZAR.md`): `marketplace_ads` é uma tabela
genérica, com um `details jsonb` livre por tipo de anúncio, e já tinha
sido estendida com uma coluna `module` para distinguir marketplaces.
`marketplace_photos`, `marketplace_favorites` e o conjunto
`marketplace_conversations`/`marketplace_messages`/
`marketplace_message_attachments` são completamente genéricos, ligados
só por `ad_id`. Por isso o Lup, tal como o Gran Bazar antes dele, **não
tem tabela de anúncios própria** — é só mais um valor de `module`.

## 2. Modelo de dados

### `marketplace_ads.module`
`'lup'` acrescentado ao CHECK já existente (`'mercado-da-terra'`,
`'gran-bazar'`), de forma aditiva — ver
`supabase/migrations/20260823030000_lup.sql`.

### `marketplace_ads.status`
Sem alterações — o CHECK que o Gran Bazar já tinha ampliado (`draft,
active, reserved, sold, traded, given, expired, cancelled, inactive`) já
cobre o ciclo de vida de um anúncio do Lup: `given` para uma doação já
entregue, `expired` para uma janela de recolha que passou sem ninguém
levantar.

### Categorias — os "três ciclos"
`categories.type` ganhou o valor `'lup'`, com exatamente **3**
categorias fixas (ao contrário do Gran Bazar, que tem 18 e pode crescer):

| slug               | nome                 | ícone |
|---------------------|----------------------|-------|
| `lup-humano`         | Consumo Humano       | 🥗    |
| `lup-animal`          | Alimentação Animal   | 🐾    |
| `lup-compostagem`     | Compostagem          | 🌱    |

Isto mapeia diretamente as 3 categorias do MVP original (`humano`,
`animal`, `compostagem` em `Category` no SobraCiclo).

### Tipos de anúncio (`lib/lup/ad-types.ts`)
Só 3, deliberadamente mais simples que o Gran Bazar (que tem
venda/troca/oferta/procura/leilão) — o Lup não faz sentido com troca nem
leilão:

- **`oferta`** — doação gratuita (`price_type = 'free'`).
- **`venda`** — preço simbólico (`price_type = 'fixed'`, ex: "Caixa
  Surpresa" a 3,50€, inspirado no mock do SobraCiclo).
- **`procura`** — para quem precisa de recolher excedentes (ex: uma
  associação ou abrigo a pedir doações). Sem quantidade/preço/janela de
  recolha próprios — o título/descrição já dizem o que se procura.

### Campos específicos do Lup, dentro de `details` (jsonb)
Nenhuma tabela nova — tudo em `marketplace_ads.details`, tal como o Gran
Bazar guarda os parâmetros do leilão lá:

- `quantity` + `unit` (ex: "5" + "caixas") — obrigatório em `oferta` e
  `venda`.
- `kg_estimate` (opcional) — peso aproximado, usado só para estimar o
  impacto (ver abaixo).
- `pickup_starts_at` / `pickup_ends_at` (ISO, UTC) — janela de recolha.
  `pickup_ends_at` é obrigatório em `oferta` e `venda` (um excedente
  perecível precisa sempre de um prazo). Mesma disciplina de conversão
  do `bazar-ad-form.tsx` para `<input type="datetime-local">`: só no
  browser, sempre com os getters *locais* do `Date`.

### Estimativa de impacto (CO₂ evitado)
Não é uma medição científica nem depende de nenhuma tabela — é uma
função pura em `lib/lup/ad-types.ts`
(`estimarCo2Evitado(kgEstimate)`), que multiplica o peso indicado pelo
autor por um fator médio citado com frequência para desperdício
alimentar (~2,5 kg CO₂e por kg). É só um número indicativo mostrado no
cartão e na página do anúncio ("~X kg CO₂ evitado (estimativa)"), na
mesma linha do que o MVP SobraCiclo mostrava com `impact.co2Avoided` —
mas sem fingir precisão que os dados não têm.

### Fotos, favoritos, mensagens, storage
Sem alterações de esquema — reutilizados tal e qual, incluindo o bucket
`marketplace-photos` já declarado pela migration do Gran Bazar.

## 3. Rotas

```
/lup                     listagem (hero + pesquisa + tabs por ciclo)
/lup/[id]                detalhe do anúncio
/lup/novo                publicar anúncio
/lup/editar/[id]         editar anúncio (só o autor)
/lup/meus-anuncios       os meus anúncios
/lup/favoritos           anúncios guardados
/lup/mensagens           caixa de entrada (só conversas de anúncios do Lup)
/lup/mensagens/[id]      conversa
```

## 4. Isolamento entre módulos

Todas as queries de leitura do Lup filtram explicitamente por `module =
'lup'` (listagem, detalhe, meus-anúncios, mensagens — mesma disciplina
que o Gran Bazar já aplicava para não vazar para o Mercado da Terra e
vice-versa). Como as três coleções de `module` são mutuamente
exclusivas por CHECK, um anúncio nunca pode aparecer em mais do que um
módulo.

## 5. Identidade visual

Paleta `lup` nova em `tailwind.config.ts` — verdes de economia circular,
deliberadamente distinta de `terra` (Mercado da Terra) e `bazar` (Gran
Bazar). Componentes próprios em `components/lup/`, reutilizando só peças
utilitárias genéricas sem identidade de módulo (upload de imagens,
autocomplete de município — os mesmos que o Mercado da Terra e o Gran
Bazar já usam).

## 6. Diferenças deliberadas face ao Gran Bazar

- **Tabs da listagem são por categoria (ciclo), não por tipo de
  anúncio** — o eixo mais importante para navegar no Lup é "que tipo de
  excedente procuro" (humano/animal/compostagem), não "vendo/ofereço".
  O filtro por tipo existe, mas fica nos filtros avançados.
- **Sem leilão nem troca.**
- **Categoria é um `<select>` fechado com 3 opções**, não uma lista que
  cresce — a UI não precisa de paginação nem de "mais categorias".

## 7. Limitações conhecidas desta primeira versão

- Moderação: não implementada, mesma situação que o Gran Bazar (`status`
  é texto livre validado só por CHECK — acrescentar
  `PENDING_REVIEW`/`APPROVED`/`REJECTED` no futuro é aditivo).
- Paginação: a listagem carrega todos os anúncios ativos de uma vez,
  mesma decisão pragmática que o Gran Bazar e o Mercado da Terra já
  tomavam.
- Nenhum job automático marca `pickup_ends_at` expirado como `status =
  'expired'` — fica visível como ativo até o autor o marcar manualmente
  ou até ser reaproveitado o mesmo mecanismo de avanço de estado que os
  leilões do Gran Bazar já têm (`gran_bazar_advance_auctions`, chamado
  periodicamente) — seria preciso um equivalente para o Lup se isto se
  tornar um problema.
- Sem cálculo real de emissões evitadas — só a estimativa simples
  descrita acima, claramente rotulada como tal.
