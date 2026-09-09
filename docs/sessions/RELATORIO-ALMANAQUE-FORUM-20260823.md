# Relatório — Almanaque (rota `/almanaque`) e Forum (fotos + navegação)

**Data:** 2026-08-23
**Âmbito:** duas frentes de trabalho independentes, tratadas como domínios
separados por instrução explícita — (1) ligar os componentes de Culturas
já existentes a uma rota real `/almanaque`; (2) corrigir navegação do
Forum e concluir o suporte a fotos em tópicos/respostas. Sem qualquer
ligação entre os dois módulos.

## 1. Ponto de partida

O prompt inicial desta sessão pedia continuação de um plano extenso
("OTJ × Almanaque", 14 blocos) a partir de checkpoints já produzidos em
`~/Transferências/`. Verificação desses ficheiros (`OTJ-ALMANAQUE-FASE2`
a `FASE6`, ~20 ficheiros, alguns com 500KB+) mostrou que eram, na
prática, *dumps* em bruto de `find`/`grep` — nenhuma decisão de modelo de
dados ou implementação real tinha sido tomada nessa via; o próprio
ficheiro de gate da Fase 5 confirmava "esta fase não faz push para
produção" com todos os itens por marcar.

A investigação directa ao código encontrou uma peça de trabalho real e
não commitada: a migration "Fase 7" de `culturas_guia` (20 de agosto),
que já estava aplicada à base de dados (72 culturas, 12 aptidões, 12
produtos, confirmado por query directa à REST API do Supabase) mas cujo
frontend (`components/almanaque/*`) nunca tinha sido ligado a nenhuma
rota — ficheiros `??` no git, sem nenhum `import` a partir de `app/`.

## 2. O que foi feito

### 2.1 Almanaque — rota `/almanaque` (commit `52feaad`)

- `app/almanaque/page.tsx` — página inicial do Almanaque, com três
  cartões: Almanaque Diário (liga a `/calendario`, já existente e
  funcional — reutilizado, não duplicado), Guia de Culturas, Dashboard.
- `app/almanaque/culturas/page.tsx` e `app/almanaque/culturas/[id]/page.tsx`
  — montam `CulturasPage`/`CulturaDetailPage` já existentes.
- `app/almanaque/dashboard/page.tsx` — monta `DashboardMainPage`.
- `lib/almanaque/queries.ts` — camada de dados nova: `culturas_guia` +
  `culturas_aptidoes` + `culturas_produtos` via Supabase, com
  `listarCulturas`, `listarCategorias`, `obterCultura`,
  `calcularEstatisticas`.
- Correcções nos componentes reutilizados (estavam escritos contra um
  esquema ligeiramente diferente do real):
  - `id: number` → `id: string` (a BD usa `uuid`, não `number`).
  - `nome_cientifico` → exposto como `descricao_cientifico` (nome que os
    componentes já esperavam).
  - `parte_planta` → exposto como `parte_usada` (idem).
  - Filtro de categoria no Guia de Culturas: recolhia estado
    (`category_id`) mas nunca filtrava nada — corrigido para filtrar de
    facto.
- `app/page.tsx`: cartão "Almanaque" na home, a substituir um
  placeholder "brevemente" morto.
- Dependência `recharts` (já estava em `package.json`/`package-lock.json`
  por trabalho anterior não commitado, necessária para os gráficos do
  dashboard) incluída no mesmo commit para o build não ficar partido.
- Ficheiros de esquema declarativo incluídos para o dump ficar
  consistente com a BD real: `culturas_aptidoes.sql`,
  `culturas_produtos.sql`, colunas novas em `culturas_guia.sql`,
  `.pgdelta-export.json` actualizado.

**Testado:** `npm run build` (typecheck limpo para tudo o que foi tocado
— os erros que sobram são pré-existentes em `app/(alojamento)/` e
`lib/alojamento/actions.ts`, não relacionados); `npm run dev` com
pedidos reais a `/almanaque`, `/almanaque/culturas`,
`/almanaque/dashboard`, `/almanaque/culturas/[id]` válido (200) e
inválido (404 correcto); confirmado visualmente que a Lavanda mostra as
suas aptidões (Aromática, Ornamental) e produtos (Óleo essencial, Flor
seca) reais da BD.

**Instrução explícita do utilizador, respeitada nesta e nas sessões
seguintes:** não ligar o Forum ao Almanaque, não modificar componentes
ou modelo de dados do Almanaque, não tocar em Mercado da Terra,
Alojamento, Gran Bazar ou Parceiros.

### 2.2 Forum — navegação e fotos (commit `38466c0`)

Módulo tratado como domínio totalmente separado do Almanaque, sem
nenhuma alteração cruzada.

- `app/forum/[slug]/page.tsx`, `app/forum/topico/[id]/page.tsx`,
  `app/forum/pesquisa/page.tsx`: migração de `params`/`searchParams`
  síncronos para o padrão assíncrono (`Promise<...>` + `await`) exigido
  pelo Next 16 — sem isto as rotas rebentavam.
- `app/forum/page.tsx`: o título de cada categoria de topo passou a link
  para `/forum/[slug]`; a grelha de subcategorias só é renderizada
  quando a categoria tem filhos. Antes disso, categorias de topo sem
  subcategorias (ex.: Tradição, Geral, Almanaque — esta última é uma
  categoria do Forum, sem relação com a rota `/almanaque`) ficavam com
  um bloco de grelha vazio e o título não era clicável, cortando o
  acesso directo a essas categorias.
- `components/forum/new-thread-form.tsx`, `components/forum/reply-form.tsx`,
  `components/forum/post-item.tsx`: upload opcional de até 5 fotos por
  tópico/resposta (validação de tamanho e quantidade no cliente, upload
  para o bucket `forum-images`, registo em `post_images`, exibição em
  grelha no post).
- `supabase/migrations/20260822180000_forum_post_images.sql`: tabela
  `post_images`, RLS (leitura pública, escrita/remoção só pelo autor do
  post) e bucket de storage `forum-images`, seguindo o mesmo padrão já
  usado em `marketplace_photos`.

**Testado:** `npm run build` (typecheck limpo, mesmos erros
pré-existentes e não relacionados em Alojamento); `npm run dev` com
pedidos reais a `/forum`, `/forum/tradicao` (categoria de topo sem
subcategorias — confirmado título clicável e sem grelha vazia),
`/forum/horta` (categoria com subcategorias), `/forum/cenoura`
(subcategoria), `/forum/pesquisa?q=tomate`, `/forum/topico/17` — todos
200.

## 3. Estado dos commits

| Commit | Conteúdo | Push |
|---|---|---|
| `52feaad` | Almanaque: rota `/almanaque`, `lib/almanaque/queries.ts`, correcções nos componentes de Culturas, dependência `recharts`, esquema declarativo `culturas_aptidoes`/`culturas_produtos` | Feito (`origin/main`) |
| `38466c0` | Forum: navegação de categorias, fotos em posts, migration `post_images` | **Não** feito — por fazer se confirmado |

## 4. Pendentes

### 4.1 Directamente relacionados com este trabalho

| Pendente | Porquê importa | Onde |
|---|---|---|
| `git push` do commit `38466c0` | O commit do Forum está só local; o remoto (`origin/main`) ainda não tem a correcção de navegação nem as fotos. | — |
| Aplicar a migration `20260822180000_forum_post_images.sql` ao Supabase remoto | Sem `supabase db push` (ou equivalente), o bucket `forum-images` e a tabela `post_images` podem não existir em produção — o upload de fotos falharia silenciosamente lá. | `supabase/migrations/` |

### 4.2 Descobertos durante o trabalho, fora do âmbito desta sessão

| Pendente | Descrição | Prioridade sugerida |
|---|---|---|
| Erros de `tsc` pré-existentes em Alojamento | `app/(alojamento)/alojamento/[id]/page.tsx` e `lib/alojamento/actions.ts` têm erros de tipo reais (propriedades inexistentes, `uuid` vs `number`, `Localizacao` incompleta) que impedem `npm run build` de terminar com sucesso hoje. Não foram tocados por não fazerem parte do âmbito (Alojamento está explicitamente fora desta integração). | Alta — bloqueia qualquer build limpo do projecto |
| Ficheiros soltos na raiz do repositório (`OTJ_CULTURAS_*.sql`, `culturas_guia_inspecao*`, `.env.local.save`, `"upabase db push --dry-run"`) | Resíduos de sessões anteriores de auditoria/migração da Fase 7, já aplicada. Não apagados por prudência (regra do projecto: não apagar sem necessidade), mas poluem a raiz do repositório. | Baixa — arrumação |
| Trabalho não commitado de outras frentes (Mercado da Terra, Alojamento, Gran Bazar, Parceiros, Entidades) | Ficam tal como estavam no início desta sessão — não avaliados nem tocados, por instrução explícita. | — (fora do âmbito) |
| Padrão de "auditoria em bruto" em `~/Transferências/` | As ~20 fases `OTJ-ALMANAQUE-FASE*` não produziram decisões nem código — se o plano original de 14 blocos for retomado, vale a pena não repetir esse padrão (dumps de `grep`/`find` sem síntese) e continuar a validar directamente contra o código e a BD reais, como foi feito aqui. | Informativo |

## 5. Ficheiros relevantes

**Almanaque:**
- `app/almanaque/page.tsx`
- `app/almanaque/culturas/page.tsx`
- `app/almanaque/culturas/[id]/page.tsx`
- `app/almanaque/dashboard/page.tsx`
- `lib/almanaque/queries.ts`
- `components/almanaque/` (culturas-page, cultura-list, cultura-card, cultura-filter, cultura-detail-page, dashboard/*)
- `supabase/schemas/public/tables/culturas_guia.sql`, `culturas_aptidoes.sql`, `culturas_produtos.sql`

**Forum:**
- `app/forum/page.tsx`, `app/forum/[slug]/page.tsx`, `app/forum/topico/[id]/page.tsx`, `app/forum/pesquisa/page.tsx`
- `components/forum/new-thread-form.tsx`, `components/forum/reply-form.tsx`, `components/forum/post-item.tsx`
- `supabase/migrations/20260822180000_forum_post_images.sql`
