# Pendentes — 13 Setembro 2026

Origem: sessão de 12 Set (ver `docs/sessions/SESSAO-20260912.md`)
mais bloqueadores herdados de sessões anteriores.

---

## P0 — Segurança, fazer primeiro

### 1. Rodar `SUPABASE_SECRET_KEY` — RESOLVIDO, 13 Set
A chave `sb_secret_...` foi impressa no terminal e no chat durante o
debug do `.env.local` a 12 Set. Ignora RLS, acesso total à BD.

Chave nova criada e a app atualizada (`lib/supabase/admin.ts`,
`scripts/sync-vehicle-catalog.mjs`); `grep` confirmou nenhum valor real
em ficheiro versionado (só o nome da variável em 3 sítios cosméticos,
sem risco); `npm run build`/`npm test` confirmaram a app a funcionar
com a chave nova. **Chave antiga revogada pelo Yos no dashboard, 13
Set** — item fechado por completo.

Segundo incidente do género — ver
`claude_INCIDENTE-SEGREDO-GITHUB-PUSH-PROTECTION-20260909.md`.
Vale a pena decidir uma prática para não repetir (nunca `cat` sobre
ficheiros de env; usar `awk` só com nomes de chave).

### 1b. `marketplace_ads` — bypass do RPC-only — RESOLVIDO, 13 Set

O "RPC-only writes" desta manhã (commit `91700ec`) não bloqueava
mesmo nada em `jobs`, `marketplace_ads`, `restaurante_reservas` e
`reservas_alojamento` — as migrations criaram policies `(false)` mas
nunca apagaram as policies antigas que ainda permitiam escrita
direta, e no Postgres policies PERMISSIVE combinam-se com OR.

Corrigido por completo nas 4 tabelas (migrations
`20260913160000_fechar_bypass_rpc_only.sql`,
`20260913170000_alargar_marketplace_ad_editar.sql`,
`20260913180000_fechar_bypass_marketplace_ads.sql`,
`20260913190000_corrigir_marketplace_ad_apagar_status.sql` — detalhe
completo em `docs/planos/20260913T0945-plano-sessao.md`). Para
`marketplace_ads` foi preciso mais do que apagar policies: alargar
`marketplace_ad_editar()`, migrar os 4 ficheiros
`lib/marketplace/{retailing,beleza,mediacao,consultorio}-actions.ts`
para usarem as RPC em vez de `.update()`/`.delete()` diretos, corrigir
um bug pré-existente em `marketplace_ad_apagar()` (gravava
`status='deleted'`, valor que não passa no CHECK constraint — nunca
tinha funcionado desde que foi criada esta manhã) e, por fim, revogar
`INSERT/UPDATE/DELETE/TRUNCATE` de `authenticated` na tabela (não
bastava apagar as policies, porque `marketplace_ads_minors_check`
sozinha reabriria a falsificação de autoria fechada há 2 dias).
Reconfirmado por testes empíricos (sempre em transação com
`ROLLBACK`, zero dados reais tocados): escrita direta bloqueada nas 4
tabelas, as RPC continuam a funcionar para o dono legítimo.

**Verificado e resolvido, 13 Set:** confirmado que quase todas as
~190 tabelas de `public` tinham `TRUNCATE` concedido tanto a `anon`
como a `authenticated` — não é um erro deste projeto, é o
comportamento por omissão antigo do próprio Supabase (o Supabase
confirma na documentação que estão a mudar isto e já recomendam
reverter). TRUNCATE nunca passa pela RLS e nada na app o usa —
revogado em todo o schema, risco zero (migration
`20260913200000_revogar_truncate_anon_authenticated.sql`, inclui
`ALTER DEFAULT PRIVILEGES` para tabelas novas não voltarem a herdar
isto). Confirmado depois: zero grants de TRUNCATE restantes.

**Decisão do Yos — fica fora, para outra sessão:** o mesmo padrão em
INSERT/UPDATE/DELETE — `anon` (visitante sem sessão) tem essas
permissões em ~90 tabelas, `authenticated` em ~100. Aí a RLS é mesmo a
única linha de defesa; mudar isto exige rever tabela a tabela, não é
para fazer de ânimo leve.

---

## P1 — Fechar o trabalho de ontem

### 2. Apagar ou reescrever os testes falsos — RESOLVIDO, 13 Set
Enquanto existirem, dão cobertura aparente onde não há nenhuma.

- `tests/social/e2e-social-adesoes-minors.test.ts` — dez
  `expect(true).toBe(true)`. **Apagado** pelo Yos no seu terminal (13 Set).
- `supabase/tests/security/rls-policies-block.test.sql` — o
  `EXCEPTION WHEN others THEN RAISE NOTICE 'PASS'` dá verde a qualquer
  resultado, incluindo função rebentada. **Reescrito a sério** em
  `tests/e2e/rpc-only-writes.e2e.test.ts` (mesmo molde de
  `tests/e2e/social-complete.e2e.test.ts`, BD real + sessão real). O
  ficheiro `.sql` original ficou só um comentário a apontar para o novo
  — falta só apagá-lo fisicamente (`rm
  supabase/tests/security/rls-policies-block.test.sql`), sem terminal
  nesta sessão para o fazer.

### 3. Exercitar as RPC nunca chamadas — RESOLVIDO, 13 Set
SQL aplicado e commitado, zero execuções. `marketplace_ad_criar` chama
`e_menor_agora()`, que esteve partida — está corrigida por arrasto mas
ninguém confirmou.

Todas exercitadas com sucesso, direto na BD de produção (transação com
`ROLLBACK`, zero dados reais tocados) e/ou pelo novo teste E2E real:

- `marketplace_ad_criar` / `_editar` / `_apagar` — ✅ (já confirmadas
  esta manhã ao corrigir o P0 NOVO; sem bugs)
- `restaurante_reserva_criar` / `_editar` / `_cancelar` — ✅
  (`_cancelar` faz DELETE real da linha, não soft-delete — confirmado
  no código, não é um bug)
- `alojamento_reserva_criar` / `_editar` / `_cancelar` — ✅ (RPC
  paralela à `criar_reserva_alojamento`, que é a que a app usa —
  também exercitada; ambas sem bugs)
- `job_criar` / `_editar` / `_fechar` — ✅, incluindo `_publicar` /
  `_pausar` / `_reabrir` (criadas na mesma migration). Única
  subtileza: `job_reabrir` só actua a partir de `estado='fechada'` e
  devolve a vaga a `'pausada'` (não republica sozinho) — não é bug,
  confirmado pelo código; testado com a sequência correta.

Nenhum bug novo encontrado nesta ronda (ao contrário do
`marketplace_ad_apagar()`, encontrado mais cedo hoje).

### 4. Verificar se há mais aritmética de datas partida
O bug do `e_menor_agora()` pode ter irmãos.

```sql
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosrc LIKE '%interval%';
```

### 5. Frontend ainda usa INSERT/UPDATE directo — RESOLVIDO 13 Set

Auditado `app/` e `lib/` à procura de `.from('<tabela>').insert(/.update(`
contra as 7 tabelas fechadas hoje (`social_posts`, `social_post_comments`,
`social_post_reactions`, `marketplace_ads`, `jobs`, `restaurante_reservas`,
`reservas_alojamento`). **Não apanhado pelo build nem pelo tsc** —
confirmado o motivo de ser preciso `Grep` manual em vez de confiar nesses
dois.

- `social_posts`/`_comments`/`_reactions` — já 100% via RPC
  (`social_create_post`, `social_delete_post`, `social_create_comment`,
  `social_delete_comment`, `social_toggle_reaction`). Nada a corrigir.
- `restaurante_reservas`, `marketplace_ads` — já corrigidos mais cedo
  hoje (P0 NOVO, item 1b acima).
- `reservas_alojamento` — `atualizarStatusReserva()`/`cancelarReserva()`
  em `lib/alojamento/actions.ts` fazem `.update()` direto, mas
  **confirmado código morto** (já tinha sido verificado ao aplicar a
  migration de hoje que fechou o bypass — nenhuma página/componente as
  chama). Não corrigido de propósito — ver "Decisão em aberto" abaixo.
- **2 bugs novos encontrados, ambos causados pela própria migration de
  hoje `20260913160000_fechar_bypass_rpc_only.sql`** (que assumiu,
  incorretamente, que não havia escrita directa a `jobs` em lado
  nenhum — havia, só não nos ficheiros óbvios de `empregos/empresa/vagas/`):
  - `app/admin/empregos/actions.ts` (`rejeitarVagaAdmin`,
    `reativarVagaAdmin`, `rejeitarVagaEResolverDenuncia`) fazia
    `.from('jobs').update({estado: ...})` direto, confiando na policy
    `ALL` de admin que foi substituída por `SELECT`-only — moderação de
    vagas por admin ficou partida. Corrigido com RPC nova
    `job_admin_definir_estado()` (mesmo molde de
    `job_publicar/_pausar/_reabrir/_fechar`, `SECURITY DEFINER`, usa
    `e_admin()`) — migration `job_admin_definir_estado_rpc`.
  - `app/empregos/empresa/vagas/[id]/editar/page.tsx` (`atualizarVaga()`,
    a própria página de editar vaga da empresa) fazia
    `.from('jobs').update({...10 campos...})` direto, confiando na
    policy `ALL` "Empresa gere as suas vagas" (também substituída por
    `SELECT`-only) — editar uma vaga já publicada ficou partido.
    `job_editar()` já existia mas só cobria 4 dos 10 campos do
    formulário — alargada para cobrir todos (migration
    `alargar_job_editar_rpc`), overload antiga com 5 parâmetros
    removida (nunca foi chamada por ninguém — RPC órfã confirmada mais
    cedo hoje). Página migrada para chamar a RPC.
  - Ambos testados empiricamente (transação com `ROLLBACK`, perfil e
    vaga descartáveis, zero dados reais tocados): a RPC de admin
    funciona para um perfil promovido a admin e é bloqueada para um
    perfil comum; `job_editar()` alargada grava os 10 campos
    corretamente.

**Nota para sessões futuras:** os dois bugs acima confirmam que uma
migration de RLS que "fecha bypass" pode partir ecrãs que ninguém
verificou explicitamente — o `Grep` que confirmava "nenhuma escrita
directa" só olhou para os ficheiros óbvios do módulo (criar/mudar
estado), não para o admin nem para o editar. Da próxima vez que se
fechar uma policy `ALL`/`USING(false)`, `Grep` **todo** o `app/` e
`lib/` por `.from('<tabela>')` (não só `.insert(`) antes de aplicar,
não depois.

---

## P2 — Bloqueadores herdados

| Item | Origem |
|---|---|
| Escutismo Fase 2 — 1ª parte escrita 13 Set (inscrição+adesão), decisão de tutoria em aberto | `ESCUTISMO-20260904.md`, `docs/planos/20260913T0945-plano-sessao.md` |
| Educação/Universidades — **por escrever do zero**, não "por aplicar" (ver nota 13 Set no próprio ficheiro) | `EDUCACAO-UNIVERSIDADES-20260905.md` |
| Módulo Freguesia Fase F — **RESOLVIDO 13 Set**: backfill das 16 linhas feito (afinal são todas mock/demo, não reais — confirmado com o Yos) e página `/entidades/[slug]` já mostra os dados do vertical associado. Confirmado visualmente pelo Yos no browser (`/entidades/casa-rural-ronfe`), 13 Set — fechado por completo. Falta só, para outra sessão: fluxo de criação de restaurante/alojamento/comércio na app (não existe ainda, por isso não há `entity_id` a preencher no código) | `docs/planos/20260913T0945-plano-sessao.md` |
| OAuth social login | `OAUTH-SOCIAL-LOGIN-20260828.md` |
| StandGo / Autonex renomeação | `STANDGO-REFORCO-AUTONEX-RENOME-20260829.md` |
| DB diff declarativo não configurado | `DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md` |
| Regras de menores na publicação — decisão | `DECISAO-REGRAS-MENORES-PUBLICACAO-20260907.md` |
| SendGrid pausado, domínio definitivo | `SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md` |
| GRANT excessivo a `anon`/`authenticated` (INSERT/UPDATE/DELETE por omissão do Supabase em ~90-100 tabelas, a RLS é a única defesa) — decisão adiada a 13 Set, ver `docs/planos/20260913T0945-plano-sessao.md` | `docs/planos/20260913T0945-plano-sessao.md` |

---

## P3 — Almanaque (linha separada)

- Rebranding: 5 passos manuais (Opção A)
- ~12 referências a "Borda d'Água" no Vol. IV
- Anos desactualizados no PWA
- Volume XI/XII: reconciliar numeração
- Deploy do site multi-volume no Netlify
- Feiras: directório completo de Portugal

---

## Nota importante para sessões futuras — dados na BD de produção

Confirmado pelo Yos a 13 Set, ao investigar a Fase F: **é tudo mock em
toda a plataforma**, não é caso isolado dos restaurantes/alojamentos.
Documentos anteriores que descrevem linhas específicas como "reais"
(ex.: "16 linhas reais" na Fase F) não são fiáveis nesse ponto —
confirmar sempre pelo conteúdo (nomes com `[MOCK]`/"Teste",
descrições que dizem "fictício"/"para testes") antes de tratar
qualquer registo como dado de produção real.

## Decisões em aberto

### `atualizarStatusReserva()`/`cancelarReserva()` em `lib/alojamento/actions.ts` — o que fazer com o código morto

Confirmado (de novo) 13 Set, ao auditar o item 5: nenhuma página/
componente chama estas duas funções — quem gere uma reserva de
alojamento hoje só o faz através de `criar_reserva_alojamento` (criar)
e não há UI de editar/cancelar. Não corrigidas de propósito, porque
corrigir código morto sem ligar a nada não traz benefício imediato.
Por decidir, sem urgência: apagar as duas funções (ficam só a confundir
uma auditoria futura) ou construir a UI de gerir reserva que as ligue
(nesse caso, usar as RPC `alojamento_reserva_editar`/`_cancelar` já
exercitadas hoje, não reescrever `.update()` direto).

*(a única outra decisão em aberto, naming das policies, foi resolvida a
13 Set, ver abaixo)*

### Naming das policies — RESOLVIDO, 13 Set

260 policies do schema `public` padronizadas para `tabela_acao`
(snake_case, sem acentos, sem mistura PT/EN) via `ALTER POLICY ...
RENAME TO ...` (zero risco de alterar semântica — um rename não pode
mudar `qual`/`with_check`/`roles`). 3 policies duplicadas/subsumidas
apagadas (`alojamentos`, `restaurantes`, `social_posts`), 199
renomeadas. Detalhe completo em
`docs/planos/20260913T0945-plano-sessao.md`, secção "Naming das
policies (PT/EN, com/sem acentos) — feito, 13 Set". Migration:
`20260913210000_padronizar_naming_policies.sql`.

---

## P-final — só resolver depois de tudo o resto (não é para hoje nem para esta semana)

### Marketplace de serviços (retailing/beleza/mediação/consultório) sem hub nem navegação
As páginas de criar anúncio (`/retailing/novo`, `/beleza/novo`,
`/mediacao/novo`, `/consultorios/novo`) existem e funcionam (corrigidas
a 13 Set — deixaram de fazer INSERT direto, passaram a chamar
`marketplace_ad_criar`), mas são só páginas de teste diretas por URL —
não têm hub, listagem, card nem página de detalhe públicos, e não
estão ligadas a nenhum menu do site. Ver comentário em
`app/retailing/novo/page.tsx`: "não é a Fase 2/3 do plano original".

Resolver só no final de tudo o resto — construir hub + listagem + card
+ página de detalhe para os quatro, ligar ao menu principal.

**Nota do Yos, 13 Set:** testado até agora só com um único utilizador
mock (criar anúncio nos 4 módulos) — falta testar com mais do que um
utilizador (ex.: dono vs. outro utilizador a tentar editar/apagar,
visibilidade entre contas). Fica para resolver junto com o item acima,
quando o hub/listagem/detalhe forem construídos — não isoladamente
antes disso.

### Regras para utilizadores entre os 16 e os 18 anos
`idade_adulto_adesoes = 18` foi gravado em `config_plataforma` como
**provisório**. Decisão já tomada para os menores de 16 (não podem
publicar fora dos respetivos grupos, exceto Agenda Agrícola — ver
`DECISAO-REGRAS-MENORES-PUBLICACAO-20260907.md`). Falta decidir
especificamente o que os utilizadores entre 16 e 18 podem fazer — "em
estudo" desde pelo menos 07/09, movido para aqui a pedido do Yos a 13/09:
**ler e decidir no final de tudo o resto**, não isoladamente no meio de
outro trabalho.
