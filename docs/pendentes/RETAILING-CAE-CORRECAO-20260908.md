# Retailing/Beleza/Consultórios/Mediação + CAE — correção 08/09/2026

**Contexto:** os 20 ficheiros de 07/09/2026 (CAE + 4 módulos de
marketplace) nunca chegaram a ser descarregados — só ficaram guardados
no projeto os relatórios sobre o que tinha sido feito, não o código.
Esta sessão ligou-se ao computador, recuperou os ficheiros originais
(pré-correção) a partir de `telemovels4.zip` em `~/Transferências`, e
reescreveu tudo de raiz confirmando o schema real diretamente em
`supabase/schemas/public/tables/` — não a partir dos relatórios da
sessão anterior, que tinham um erro (ver abaixo).

## Erro encontrado nos relatórios de 07/09 (corrigido agora)

Os relatórios de 07/09 diziam para resolver `category_id` por nome via
`marketplace_categories`. Isto está errado: a FK real é

```sql
constraint marketplace_ads_category_id_fkey
  foreign key (category_id) references public.categories(id)
```

`category_id` aponta para `categories` (que tem `type` com CHECK em
`forum/marketplace/almanaque/general`), não para `marketplace_categories`
— essa tabela existe mas não é o que a FK usa. Todas as migrations e
`actions.ts` desta correção inserem/resolvem categorias em `categories`
com `type = 'marketplace'`.

## O que foi corrigido em todos os 4 módulos

| Campo assumido (errado) | Campo real |
|---|---|
| `marketplace_ads.criador_id` | `author_id` |
| `titulo` / `descricao` | `title` / `description` |
| `categoria_id` (texto) | `category_id` (inteiro, FK para `categories`) |
| `metadata` | `details` (jsonb) |
| `status = 'ativo'` | `status = 'active'` |
| `publicado_em` / `atualizado_em` | não existem — `updated_at` é mantido automaticamente por um trigger genérico (`marketplace_ads_updated_at`), já existente para toda a tabela |
| `marketplace_categories(slug, nome, icone, ...)` | `categories(name, slug, type, icon, description)` |
| bucket `marketplace-photos` | bucket real: `marketplace-images` |
| `marketplace_photos(anuncio_id, url, ordem)` | `ad_id`, `storage_path`, `sort_order` |
| `id` tratado como string/uuid | `id` inteiro (serial) |

Outras correções feitas ao mesmo tempo:
- Verificação de dono feita na própria query (`.eq('id', adId).eq('author_id', userId)`), como o resto do projeto já faz.
- `apagarX()` já não apaga `marketplace_photos` manualmente — a FK tem `ON DELETE CASCADE`.
- `ano_abertura` (Retailing) usa `new Date().getFullYear()` em vez de `2026` fixo.
- `@/components/ui/textarea` não existe neste projeto (só há `badge/button/card/input`) — substituído por `<textarea>` simples com estilo equivalente ao `Input`.
- Consultórios nunca teve migration própria — criada de raiz (`consultorio-migration.sql` → `20260908090200_consultorio_categoria.sql`), categoria única "Consultório Médico".

## Campo CAE (Atividade Económica) — novo

- `lib/marketplace/cae-lista.ts` — **125 códigos CAE-Rev.3** verificados a partir de fontes públicas (não os 849 da sessão anterior, que vieram de uma extração de PDF não determinística e não puderam ser confirmados por esta sessão). Cobre com detalhe os quatro setores usados por estes módulos (comércio a retalho 47xxx, cabeleireiro/estética 96xxx, saúde/clínicas 86xxx, seguros e crédito 64-66xxx) e uma cobertura geral dos restantes setores mais comuns numa plataforma rural/comunitária. **Não é exaustivo** — é só metadado informativo no anúncio, não para fins fiscais/legais.
- `lib/marketplace/cae.ts` — `pesquisarCae()`, `obterCaePorCodigo()`, `formatarCae()`.
- `components/marketplace/cae-autocomplete.tsx` — `<CaeAutocomplete value onChange id />`, seguindo o padrão de `freguesia-autocomplete.tsx` já existente no projeto.
- Campo `cae` (opcional, `^\d{5}$`) acrescentado ao Zod schema, à interface `*Display` e ao formulário (logo a seguir à Descrição) dos quatro módulos; gravado em `details.cae`.

## Migrations (correr no `otj_test` local, nunca direto em produção)

```
supabase/migrations/20260908090000_retailing_categorias.sql
supabase/migrations/20260908090100_beleza_categorias.sql
supabase/migrations/20260908090200_consultorio_categoria.sql
supabase/migrations/20260908090300_mediacao_categorias.sql
```

## Três decisões que a sessão de 07/09 tinha deixado em aberto — mantidas em aberto

1. **`type` do anúncio** — usa-se `'servico'` (a coluna não tem CHECK, confirmado no schema real).
2. **`location`** — grava-se a morada completa (`endereco`); o resto do marketplace usa nome de município. Estes quatro módulos ficam de fora dos filtros de localidade do site enquanto isto não for decidido.
3. **`contact_method`** — fica `NULL` (nullable, tem CHECK só quando preenchido).

## O que ainda falta

- Nada disto foi testado contra a base de dados real — falta correr as migrations e `npm run build`/`npm run dev` (ver instruções que acompanham este ficheiro).
- Fase 2/3 do plano original (cards, hub, listagem, página de detalhe, edição) continuam por fazer para os quatro módulos.
