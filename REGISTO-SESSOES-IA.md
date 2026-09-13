# Registo de Sessões de IA — OTJ

Registo cronológico de sessões de trabalho com IA neste projeto. Ver `docs/sessions/` para os registos completos de cada sessão e `docs/pendentes/` para o estado de pendências no fim de cada uma.

Este ficheiro não existia antes de 2026-09-13; não foram reconstruídas entradas anteriores a essa data para não inventar histórico. As sessões anteriores estão documentadas em `docs/sessions/` (ex.: `SESSAO-20260912.md`, `SESSION-20260906.md`, etc.), mas sem uma entrada correspondente aqui.

---

## 2026-09-13T09:45 (WEST, UTC+1)

- **Plano:** `docs/planos/20260913T0945-plano-sessao.md` (detalhe completo de tudo abaixo, secção a secção)
- **Pendentes:** `docs/pendentes/PENDENTES-20260913.md`
- **Estado:** em curso (sessão ainda não fechada)

### O que ficou feito hoje, por ordem

1. **P0 — `SUPABASE_SECRET_KEY` rodada.** Código atualizado
   (`lib/supabase/admin.ts`, `scripts/sync-vehicle-catalog.mjs`) para
   ler o nome novo da variável. Âmbito afinal maior do que parecia:
   encontradas mais 3 chaves secretas em ficheiros de backup
   (`.env.local.bak-*`, `.env.local.remoto`, `.env.local.save*`) —
   apagados pelo Yos. SendGrid key exposta no mesmo ficheiro já estava
   morta/revogada desde 07/09. `CRON_SECRET` (também exposto, mas
   ativo) **não foi rodado — fica por decidir**. A `SUPABASE_SECRET_KEY`
   **antiga** foi revogada pelo Yos no dashboard, 13 Set — P0 fechado
   por completo.
2. **P1 — 7 tabelas com INSERT/UPDATE direto migradas para RPC**
   (marketplace ×4 módulos, jobs, restaurante_reservas; alojamento já
   usava RPC). RPCs `marketplace_ad_criar`/`restaurante_reserva_criar`
   ampliadas com campos em falta; `job_criar` ampliada e criadas
   `job_publicar`/`_pausar`/`_reabrir`. Testes falsos neutralizados.
   Verificado: nenhuma outra aritmética de datas partida.
3. **Validado pelo Yos no terminal dele:** testes manuais OK (criar
   anúncio, reserva, vaga + 4 botões de estado), `grep` confirmou
   nenhum segredo real em ficheiro versionado, `npm run build` limpo
   (94/94 páginas). Backups com segredos e teste falso apagados.
   **Commit `91700ec`** feito pelo Yos.
4. **P2 — convergência de padrões de admin**: `e_admin()`,
   `diaspora_is_admin()`, `pet_is_admin()` e 4 policies inline
   duplicadas convergidas para uma só fonte de verdade.
5. **P0 NOVO (achado a meio do dia, não estava nos pendentes de
   manhã): o "RPC-only writes" de hoje cedo não bloqueava mesmo nada**
   em `jobs`, `marketplace_ads`, `restaurante_reservas`,
   `reservas_alojamento` — policies antigas permissivas continuavam
   ativas ao lado das novas `(false)`, e no Postgres isso combina-se
   com OR. Corrigido nas 4 tabelas. De caminho: corrigido um bug real
   em `marketplace_ad_apagar()` (gravava um `status` que violava o
   CHECK constraint — nunca tinha funcionado).
6. **GRANT TRUNCATE indevido**: confirmado que quase todas as ~190
   tabelas tinham `TRUNCATE` concedido a `anon`/`authenticated`
   (default antigo do próprio Supabase, não erro deste projeto) —
   revogado em todo o schema. **Decisão do Yos: o mesmo padrão em
   INSERT/UPDATE/DELETE (~90-100 tabelas) fica para outra sessão
   dedicada — não é para mexer de ânimo leve.**
7. **Naming das policies (PT/EN, com/sem acentos)** — as 260 policies
   do schema `public` padronizadas para `tabela_acao`; 3
   duplicadas/subsumidas apagadas, 199 renomeadas via `ALTER POLICY
   RENAME` (zero risco semântico).
8. **Testes falsos reescritos a sério** — novo
   `tests/e2e/rpc-only-writes.e2e.test.ts` (BD real, sessão real),
   substitui o `.sql` antigo. **RPCs nunca chamadas em produção**
   (`job_*`, `marketplace_ad_*`, `restaurante_reserva_*`,
   `alojamento_reserva_*`) todas exercitadas diretamente contra a BD
   — nenhum bug novo encontrado.
9. **Fase F — backfill + ligação da página de entidade.** Achado
   importante: as 16 linhas de `restaurantes`/`alojamentos` que os
   pendentes chamavam de "reais" são **todas mock/demo** — confirmado
   pelo Yos que isto é verdade em toda a plataforma, não só ali.
   Decisão dele: backfill mesmo assim (dados de demo). 16 `entidades`
   novas criadas e ligadas via `entity_id`; `/entidades/[slug]`
   atualizada para mostrar o vertical associado.
10. **CSP do `next.config.js` corrigida para dev.** Ao testar a Fase F
    visualmente, o Yos encontrou `eval() is not supported` no
    `next dev` — a CSP de 11 Set (sem `'unsafe-eval'`, correto para
    produção) estava a aplicar-se também em desenvolvimento, onde o
    Fast Refresh do Next precisa de `eval()`. Corrigido para só ser
    estrita fora de `NODE_ENV=development`.

### Estado do Git — commit feito, 13 Set

**Resolvido.** O Yos correu `git add -A && git commit` no seu terminal:
commit `6593ab6`, 24 ficheiros (2270 insertions, 115 deletions) — as 7
migrations, os 4 ficheiros de `lib/marketplace/`, `lib/escutismo/`
(Fase 2, escrito mais cedo hoje e também nunca commitado),
`lib/freguesia/actions.ts`, `app/entidades/[slug]/page.tsx`,
`next.config.js`, `tests/e2e/rpc-only-writes.e2e.test.ts`, a remoção do
`.sql` morto, e todos os docs. `git status` confirmado limpo antes do
commit — nada fora do esperado. **Ainda não passou pelo `origin`**
(`git push`) — o Yos decide quando.

### Validação final — feita, 13 Set

`npm test`: 14 ficheiros, 132 testes, **todos a passar** — incluindo os
10 novos de `tests/e2e/rpc-only-writes.e2e.test.ts` e os 8 de
`social-complete.e2e.test.ts`, ambos contra a BD real. `npm run build`:
compilação limpa, TypeScript sem erros, 94/94 páginas geradas
(`/entidades/[slug]` incluída). Sem regressões detetadas em todo o
trabalho de hoje.

### Ainda por fazer (não é para repetir investigação, só executar)

- ~~Confirmar visualmente `/entidades/casa-rural-ronfe` no browser~~ — **feito pelo Yos, 13 Set**, card de Alojamento a aparecer bem.
- ~~Revogar a `SUPABASE_SECRET_KEY` antiga~~ — **feito pelo Yos, 13 Set** (confirmado por ele diretamente, dashboard Supabase).
- ~~`CRON_SECRET` exposto — rodar~~ — **feito pelo Yos, 13 Set**: valor novo gerado (`openssl rand -hex 32`), atualizado no projeto Vercel correto (`jj`, é mesmo o nome do projeto que serve `otiodojoca` em `jj-kappa-mocha.vercel.app`) em Settings → Environment Variables, com redeploy aceite. Ao contrário da `SUPABASE_SECRET_KEY`, este segredo é inventado pela própria app (não emitido por terceiros) — não há "chave antiga" a revogar em lado nenhum, só o valor a trocar, e o Vercel Cron já usa a env var nova automaticamente no próximo disparo (`0 7 * * *`).
- ~~`git push`~~ — **feito, 13 Set**: `6455ecf..6593ab6 main -> main` em `github.com/jaaaneves-art/otiodojoca`. Todo o trabalho de hoje está agora persistido nos três sítios (Supabase, GitHub, docs).

**Com isto, todos os itens de segurança P0 do dia (13 Set) estão fechados** e a Fase F está confirmada de ponta a ponta.

### 11. P1 item 5 — auditoria de escrita directa remanescente, 13 Set (2ª ronda)

Auditado `app/` e `lib/` à procura de `.from('<tabela>').insert(/.update(`
contra as 7 tabelas fechadas hoje. `social_posts`/`_comments`/
`_reactions` já iam 100% por RPC. Mas apareceram **2 bugs novos**,
ambos causados pela própria migration de hoje que fechou o P0 NOVO
(`20260913160000_fechar_bypass_rpc_only.sql`), que tinha assumido
(incorretamente) que não havia escrita directa a `jobs` — havia, só
não nos ficheiros óbvios:

- `app/admin/empregos/actions.ts` — moderação de vagas por admin
  (rejeitar/reativar) fazia `UPDATE` direto, ficou partida. RPC nova
  `job_admin_definir_estado()` (mesmo molde dos outros `job_*`, usa
  `e_admin()`).
- `app/empregos/empresa/vagas/[id]/editar/page.tsx` — a própria página
  de editar vaga da empresa fazia `UPDATE` direto com 10 campos,
  `job_editar()` só cobria 4 — alargada para os 10, overload antiga
  (nunca chamada) removida.

Ambas testadas empiricamente (transação com `ROLLBACK`, perfil e vaga
descartáveis, zero dados reais tocados): RPC de admin funciona/bloqueia
corretamente, `job_editar()` alargada grava os 10 campos. Detalhe
completo em `docs/pendentes/PENDENTES-20260913.md`, item 5.

`reservas_alojamento`: `atualizarStatusReserva()`/`cancelarReserva()`
em `lib/alojamento/actions.ts` continuam a ser código morto (nenhuma
página as chama) — decisão em aberto sobre apagar vs. construir a UI,
ver pendentes.

**Nota:** este ficheiro (`REGISTO-SESSOES-IA.md`) e o
`PENDENTES-20260913.md` foram atualizados depois do commit `6593ab6` —
as migrations `job_admin_definir_estado_rpc` e `alargar_job_editar_rpc`
e os 2 ficheiros de código (`app/admin/empregos/actions.ts`,
`app/empregos/empresa/vagas/[id]/editar/page.tsx`) também ainda não
foram commitados. Nada urgente, mas fica por fazer no próximo
`git add -A && git commit && git push`.

## 2026-09-13T19:40 — LUP: correção RPC-only (Europe/Lisbon, WEST UTC+1)

- **Estado: Evolução**, correção local; integração remota pendente.
- Continuação do plano `docs/planos/20260913T1749-plano-continuacao-otj.md`.
- Branch `fix/lup-rpc-20260913`, base `6593ab6`; alterações herdadas preservadas.
- **Correção ao registo anterior:** “marketplace_ads já sem escrita direta” era
  uma conclusão incompleta. Cinco marketplaces ainda faziam INSERT/UPDATE nas
  páginas novo/editar. Nesta fase foi corrigido **apenas LUP**. Os quatro
  serviços em lib/marketplace já convertidos não representam esses módulos.
- GET read-only do OpenAPI remoto confirmou assinaturas genéricas insuficientes
  e ausência da nova RPC. Nenhuma escrita remota realizada.
- Criar/editar LUP usam agora helper partilhado e `lup_ad_guardar`, mantendo
  autor/module/estado, preço/contacto/detalhes e redirect. Formulário mostra
  erros, bloqueia submits imediatos e mantém UUID nos retries. Imagens são
  validadas antes de gravar. Idempotência é de criação do anúncio; Storage
  continua best-effort e não transacional.
- Nova migration aditiva `20260913230000_lup_rpc_idempotente.sql`: coluna e índice
  único parcial por autor/chave, RPC restrita ao LUP e lock transacional.
  Aplicada só a bases locais isoladas, **não a produção**.
- Validação: TypeScript PASS, lint focado PASS; 118/118 testes na primeira
  bateria (incluindo 16 LUP), bateria LUP final 17/17; SQL PostgreSQL real com
  fixture mínima e oito pedidos concorrentes → um anúncio; Chromium 390×844
  com componente real e action dupla PASS. Não equivale a E2E Next/Supabase.
- Erro TypeScript introduzido em StorageError corrigido; nenhum erro nos checks
  finais. Build não executado. Sem push, commit ou implementação nos outros módulos.
- Relatório e outputs:
  `docs/Modules/Lup/20260913T1940-correcao-rpc-only.md` (contém lista exata dos logs).
- Próximo passo: integração da migration com schema completo e validação real
  de criação/edição/fotos antes de publicação; apresentar LUP antes de decidir
  sobre os restantes marketplaces. Não aplicar em massa migrations herdadas.

## 2026-09-13T19:54 — LUP: preparação do E2E real (Europe/Lisbon)

- Branch `fix/lup-rpc-20260913`; Git e diff verificados; trabalho herdado preservado.
- Encontrado Supabase local real em 127.0.0.1:54321, com Auth/PostgREST/Storage.
  Não é produção. Nenhum staging remoto verificável identificado na documentação consultada.
- Stack local ainda sem dependências de menoridade/adesões, categorias LUP,
  bucket marketplace-photos e grants RPC-only. Não confundir com as fixtures
  isoladas que passaram na fase anterior.
- Backup local completo criado com sucesso:
  `outputs/20260913-195222-lup-local-before-integration.dump`; log com SHA256
  em `outputs/20260913-195222-lup-local-backup.txt`. Tentativa anterior vazia
  não é backup válido. Restauro não ensaiado; bytes de Storage não incluídos.
- Pacote de preparação, dependências exatas, permissões, risco e recuperação:
  `docs/Modules/Lup/20260913T1954-preparacao-integracao.md`.
- Nenhuma migration aplicada; nenhum acesso a produção; nenhum código funcional
  alterado nesta fase. E2E real ainda NÃO executado, suites anteriores não
  repetidas sem o alvo pronto.
- Estado: bloqueio de autorização para preparar o stack local existente
  (autorizações anteriores limitadas a bases isoladas). Aguardar decisão
  conforme pontos 5–6 do pedido antes de aplicar SQL. LUP ainda não concluído
  nem aprovado como padrão dos restantes marketplaces.

## 2026-09-13 — LUP RPC-only e idempotência

**Classificação: Evolução**

Concluída a conversão do LUP para escrita através do RPC
`lup_ad_guardar`, eliminando a escrita direta da aplicação em
`marketplace_ads` nos fluxos de criação e edição do LUP.

Implementada proteção contra submissões repetidas através de
`request_id` persistente e garantia de idempotência na base de dados.

Validação local real:

- autenticação: OK;
- criação RPC: OK;
- idempotência: OK;
- repetição produziu exatamente 1 anúncio;
- INSERT direto em `marketplace_ads`: bloqueado;
- E2E final: `LUP_E2E_OK`;
- bateria focada LUP: 17 testes aprovados.

Migration principal:
`supabase/migrations/20260913230000_lup_rpc_idempotente.sql`.

Permanece pendente o reforço transacional do fluxo de fotografias entre
anúncio, Storage e `marketplace_photos`.

Não houve push, db push, reset nem alterações no Supabase remoto/produção.
As alterações existentes de Empregos foram preservadas.
