# Relatório — Entrada de Entidades Parceiras

**Data:** 2026-08-23
**Âmbito:** módulo de entrada/registo de entidades parceiras (Municípios,
Freguesias, outros organismos públicos, e outras entidades — Associações,
Cooperativas, Produtores, Empresas), a par do registo individual já
existente.

Este relatório resume o que foi construído em três rondas de trabalho e,
sobretudo, regista tudo o que ficou **pendente** — para não se perder de
vista antes de se avançar para a fase seguinte (revisão/aprovação de
pedidos, ligação a `entidades`, SSO institucional).

## 1. O que já está feito

### Ronda 1 — janela de entrada e pedido genérico

- Janela de boas-vindas na home (`components/entidades/entry-choice-
  modal.tsx`): "Sou cidadão" / "Sou entidade parceira", só para
  visitantes sem sessão.
- Cartão "Entidades Parceiras" na grelha da home, sempre visível.
- Nota na página `/login` a explicar que entidades parceiras entram com
  email + password.
- Tabela nova `public.entidade_pedidos` (migration
  `20260823010000_pedidos_entidade_parceira.sql`) — pedido de associação
  ligado a `profile_id`, com RLS (só o próprio + admins). Não escreve
  directamente em `entidades` (tabela curada).
- `/parceiros` (explicação + CTA) e formulário genérico de pedido.

### Ronda 2 — formulários individualizados por tipo

- Migration additiva `20260823020000_pedidos_entidade_tipo_e_
  municipio.sql`: acrescenta `tipo_entidade` (discriminador), `municipio_id`,
  `cargo`, `nipc` a `entidade_pedidos`.
- Quatro formulários especializados, cada um na sua rota:
  - `/parceiros/pedido/municipio` — `<select>` dos 308 municípios, liga
    `municipio_id` real.
  - `/parceiros/pedido/freguesia` — reutiliza o `FreguesiaAutocomplete`
    já existente, liga `freguesia_id` real, pré-preenche contactos.
  - `/parceiros/pedido/organismo-publico` — nome livre + categoria +
    NIPC opcional.
  - `/parceiros/pedido` — passou a ser especificamente "Outra entidade"
    (Associação/Cooperativa/Produtor/Empresa), `tipo_entidade = 'outro'`,
    mantém localização em texto livre.
- `/parceiros` passou a mostrar 4 cartões de escolha (só para
  utilizadores autenticados).

Todo o código foi validado com `tsc --noEmit` (sem erros de sintaxe) e
está já escrito em `~/Nextcloud/Projectos/otiodojoca` (ficheiros reais do
projeto, não só entregues em zip).

## 2. Pendentes

### 2.1 Ações imediatas necessárias

| Pendente | Porquê importa | Onde |
|---|---|---|
| Correr `supabase db push` | As duas migrations (`20260823010000` e `20260823020000`) ainda não foram aplicadas à base de dados real — sem isto, `entidade_pedidos` não existe em produção e nada dos formulários funciona. | `supabase/migrations/` |

### 2.2 Funcionalidade por construir

| Pendente | Descrição | Prioridade sugerida |
|---|---|---|
| Página de admin para aprovar/rejeitar pedidos | Hoje os pedidos só são visíveis via RLS para quem tem `profiles.is_admin = true`, directamente na base de dados — não há nenhuma UI. Sem isto, todo o fluxo de aprovação é manual. | Alta — é o próximo bloqueio real do fluxo |
| Ligação `entidade_pedidos.entidade_id` → `entidades` | A coluna já existe na tabela, mas nada a preenche. Quando um pedido é aprovado, é preciso decidir: criar uma linha nova em `entidades`, ou associar a uma já existente (fluxo de "reivindicar"). | Alta — depende da página de admin acima |
| Fluxo de "reivindicar" uma entidade já existente no diretório | Ex.: a Junta de Freguesia de X já consta em `entidades` (importada de fonte oficial); o pedido devia poder ligar-se a essa linha em vez de criar uma duplicada. | Média |
| SSO institucional por domínio | Login restrito a domínios institucionais (`@camara-x.pt`, Google Workspace/Microsoft 365), com associação automática à entidade correspondente. **Decisão explícita do utilizador: não tratar agora.** Depende ainda de decisões por tomar (que provedores suportar, como validar posse de domínio). | Baixa / futura — deliberadamente adiado |
| `localizacao_texto` livre no formulário "Outra entidade" | Município e Freguesia já ligam a FK real; Associação/Cooperativa/Produtor/Empresa continuam com texto livre, por não existir tabela geográfica fidedigna equivalente para esse tipo de entidade. | Baixa |
| Notificação ao requerente sobre o estado do pedido | Hoje o utilizador só vê "pedido enviado"; não há forma de saber depois se foi aprovado/rejeitado (nem página "os meus pedidos"). | Média |

### 2.3 Notas de terminologia por reconciliar

Os documentos de arquitetura mais antigos do projeto usam "Instituições"
(`institutions`, `institution_types`); o código mais recente usa
"Parceiro"/"Entidade Parceira". Os dois termos coexistem sem conflito
técnico, mas convém decidir, numa fase de consolidação de documentação,
qual fica como nome oficial.

## 3. Ficheiros relevantes

- `docs/PARCEIROS-ENTRADA.md` — documento de arquitetura/decisão completo
  deste módulo (porquê não escrever directamente em `entidades`, o que
  foi construído, roadmap de SSO, o que ficou por fazer).
- `supabase/migrations/20260823010000_pedidos_entidade_parceira.sql`
- `supabase/migrations/20260823020000_pedidos_entidade_tipo_e_municipio.sql`
- `supabase/migrations/20260826130000_entidade_pedidos_freguesia_id.sql` (novo — ver secção 4)
- `components/entidades/entry-choice-modal.tsx`
- `components/entidades/partner-request-form.tsx`
- `components/entidades/partner-request-form-municipio.tsx`
- `components/entidades/partner-request-form-freguesia.tsx`
- `components/entidades/partner-request-form-organismo.tsx`
- `app/parceiros/page.tsx`
- `app/parceiros/pedido/page.tsx`
- `app/parceiros/pedido/municipio/page.tsx`
- `app/parceiros/pedido/freguesia/page.tsx`
- `app/parceiros/pedido/organismo-publico/page.tsx`
- `app/admin/entidades/page.tsx`, `app/admin/entidades/actions.ts` (novo — ver secção 4)

---

## 4. Atualização — 2026-08-26

**"Correr `supabase db push`" (2.1) — ✅ já estava feito.** Confirmado por
`npx supabase migration list`: `20260823010000` e `20260823020000` já
apareciam em Local e Remote antes desta sessão mexer em nada. Não era
pendente real.

**🐛 Bug encontrado (não estava nesta lista): `entidade_pedidos.freguesia_id`
nunca existiu na tabela.** `partner-request-form-freguesia.tsx` grava
`freguesia_id` no insert desde a Ronda 2 (23/08) — e a documentação
(`docs/PARCEIROS-ENTRADA.md` secção 2b) descreve isso como já feito — mas
a migration `20260823020000` só acrescentou `municipio_id`, `cargo`,
`nipc`, `tipo_entidade`; `freguesia_id` ficou de fora. **Resultado: todo
pedido de Freguesia falhava ao submeter**, desde que o formulário foi
publicado — coluna inexistente, rejeitado pelo PostgREST. Corrigido em
`supabase/migrations/20260826130000_entidade_pedidos_freguesia_id.sql`
(acrescenta a coluna + índice, mesmo padrão de `municipio_id`). ✅
**Migration aplicada ao remoto** (26/08, `npx supabase db push` confirmado
pelo Yos). **Por fazer, único ponto que falta:** teste manual ao vivo de
`/parceiros/pedido/freguesia` — submeter um pedido a sério e confirmar
que já não falha.

**Página de admin para aprovar/rejeitar pedidos (2.2) — ✅ construída.**
`app/admin/entidades/page.tsx` + `app/admin/entidades/actions.ts`:
- Acesso restrito a `profiles.is_admin = true` (verificado na própria
  página; a escrita fica de qualquer forma protegida pela RLS existente
  de `entidade_pedidos`).
- Lista pedidos por estado (tabs Pendentes/Aprovados/Rejeitados via
  `?estado=`), com os dados específicos de cada `tipo_entidade`
  (freguesia/município via join real, organismo/outro via categoria +
  texto livre), dados do requerente (via `profiles`), NIPC, contactos,
  mensagem.
- Botões Aprovar/Rejeitar (server actions) atualizam `estado`,
  `resolvido_por`, `resolvido_em`; guarda contra resolver duas vezes o
  mesmo pedido (`.eq('estado', 'pendente')` no update).
- **Deliberadamente fora do âmbito desta peça** (tal como o resto deste
  relatório já previa): a ligação `entidade_pedidos.entidade_id` →
  `entidades` continua manual — aprovar um pedido não cria nem associa
  uma linha em `entidades`. Isso e o fluxo de "reivindicar" continuam
  pendentes (ver tabela 2.2, ainda válidos).
- **`npm run build` confirmado limpo pelo Yos** (26/08, depois desta
  sessão escrever os ficheiros): `Compiled successfully`, `Finished
  TypeScript` sem erros, `/admin/entidades` aparece na lista de rotas
  (`ƒ /admin/entidades`, dinâmica). Compila contra os tipos reais do
  Supabase gerado.
- **Ainda por fazer:** aplicar a migration `20260826130000` (ver acima),
  e teste manual ao vivo — submeter um pedido e aprovar/rejeitar a sério
  com uma conta `is_admin=true`. Não há ainda nenhum link de navegação
  para `/admin/entidades` — só acessível pelo URL directo.
