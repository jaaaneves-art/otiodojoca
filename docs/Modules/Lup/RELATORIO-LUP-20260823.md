# Relatório — Módulo Lup (economia circular de excedentes)

**Data:** 23 de agosto de 2026
**Sessão:** Criação do módulo Lup a partir do MVP SobraCiclo

---

## 1. O que foi pedido

Trazer o MVP standalone **SobraCiclo** (React + Vite, dados mock —
plataforma de excedentes alimentares inspirada no TooGoodToGo, com três
categorias: consumo humano, alimentação animal, compostagem) para dentro
d'O Tio do Joca, "ao nível do Gran Bazar". Nome escolhido para a caixa:
**Lup** (de "loop"), a rever mais tarde.

Decisões tomadas com o Yos antes de começar:
- Aceder ao código através da pasta local ligada no desktop app (não via
  GitHub).
- Reaproveitar `marketplace_ads` (mesma arquitetura do Gran Bazar), em
  vez de tabelas próprias.
- Identidade visual adaptada ao design system do OTJ (paleta própria,
  como o Gran Bazar tem a sua).

## 2. O que foi feito

Auditoria à arquitetura do Gran Bazar (`docs/GRAN-BAZAR.md` e o código em
`app/gran-bazar/`, `components/gran-bazar/`, `lib/gran-bazar/`) para
replicar o mesmo padrão, e criação de 22 ficheiros novos/editados:

- **`supabase/migrations/20260823030000_lup.sql`** — acrescenta `'lup'`
  ao CHECK de `marketplace_ads.module` e `'lup'` ao CHECK de
  `categories.type`; insere as 3 categorias fixas (`lup-humano`,
  `lup-animal`, `lup-compostagem`). Sem tabelas novas — mesma decisão que
  o Gran Bazar tomou.
- **`lib/lup/ad-types.ts`** — 3 tipos de anúncio (`oferta` = doação
  grátis, `venda` = preço simbólico, `procura`), campos extra guardados
  em `details` (jsonb): `quantity`, `unit`, `kg_estimate`,
  `pickup_starts_at`, `pickup_ends_at`. Inclui `estimarCo2Evitado()`, uma
  estimativa simples (não científica) a partir do peso indicado.
- **`components/lup/`** — navbar, filtros (tabs por categoria/ciclo em
  vez de por tipo), cartão de anúncio, formulário, botão de favorito,
  formulário de contacto, formulário de mensagem.
- **`app/lup/`** — listagem, `[id]`, `novo`, `editar/[id]`,
  `meus-anuncios`, `favoritos` (+ actions), `mensagens` (+ actions +
  `[id]`).
- **`tailwind.config.ts`** — nova paleta `lup` (verdes), ao lado de
  `terra` e `bazar`.
- **`app/page.tsx`** — link de navegação + `FeatureCard` para `/lup`.
- **`docs/LUP.md`** — documentação técnica completa, no mesmo formato de
  `docs/GRAN-BAZAR.md`.

Todos os ficheiros foram escritos diretamente na pasta do projeto via a
ligação ao computador (não passaram por git/GitHub).

## 3. Por fazer (imediato, para amanhã)

1. **Aplicar a migração** — `supabase db push` (ou SQL manual no
   Studio), como das outras vezes.
2. **Correr `npm run build`** — ainda não foi confirmado que compila
   limpo. Não consegui correr isto na sessão de hoje (só tenho
   leitura/escrita de ficheiros no teu computador, não um terminal).
3. **Resolver o erro do Turbopack ao correr `npm run dev`** (ver secção
   4 abaixo) — não tem nada a ver com o código do Lup, mas está a
   impedir testar seja o que for agora.
4. **Testar o fluxo todo manualmente**: publicar uma doação, uma venda
   simbólica e um pedido de procura, confirmar que aparecem corretamente
   filtrados por ciclo, testar favoritos e mensagens, confirmar que
   anúncios do Lup não aparecem no Gran Bazar/Mercado da Terra e
   vice-versa.

## 4. Bug encontrado ao arrancar `npm run dev` (não é do Lup)

```
[Error: Failed to open database
Caused by:
    0: Loading persistence directory failed
    1: Unexpected file in persistence directory:
       "/home/berze/Nextcloud2/Projectos/otiodojoca/.next/dev/cache/turbopack/v16.3.1-3d32eb87/CURRENT (conflicted copy 2026-08-23 223255)"]
```

**Causa provável:** o projeto vive dentro de `~/Nextcloud2/...`, uma
pasta sincronizada pelo Nextcloud. A cache de build do Turbopack
(`.next/dev/cache/...`) escreve ficheiros muito depressa e com muita
frequência durante o `next dev` — se o cliente Nextcloud tentar
sincronizar esses ficheiros ao mesmo tempo (ou se o dev server correu em
dois sítios/momentos que geraram conflito), cria uma "conflicted copy",
e o Turbopack não sabe lidar com um ficheiro extra e inesperado nessa
pasta.

**Correção sugerida** (não fiz isto — precisa de comandos no terminal,
que não tenho neste computador a partir desta sessão):

1. Apagar a pasta de cache: `rm -rf .next` (ou pelo menos
   `.next/dev/cache/turbopack`) e voltar a correr `npm run dev`.
2. Para não voltar a acontecer: excluir `.next/` da sincronização do
   Nextcloud (normalmente já está no `.gitignore`, mas isso não impede o
   Nextcloud de sincronizar — é preciso marcar a pasta como ignorada
   também nas definições do cliente Nextcloud, ou mover o projeto para
   fora de uma pasta sincronizada). Isto é uma pasta de cache de build,
   nunca deveria estar em sincronização na nuvem — só causa este tipo de
   conflito.

## 5. Estado

Código do Lup: **escrito e gravado**, arquitetura consistente com o Gran
Bazar, documentado em `docs/LUP.md`. **Ainda não testado** — migração
por aplicar, build por confirmar, dev server bloqueado pelo bug acima
(não relacionado).

Continuar amanhã a partir do ponto 3 (resolver o Turbopack) e depois 1-2-4.
