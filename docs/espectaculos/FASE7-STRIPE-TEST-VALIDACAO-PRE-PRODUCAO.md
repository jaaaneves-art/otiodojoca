# Espetáculos — Fase 7: Stripe Test real, Webhook real e validação pré-produção

Base: `docs/espectaculos/FASE6-E2E-STRIPE-PREPARACAO-PRODUCAO.md`
Data: 8 de setembro de 2026 · Commit base: `9ac1326` · Branch: `main`

Sem commit, push, deploy, migration remota, alteração a Supabase/Vercel, Stripe
Live, cartões reais, PII real, email real ou cron remoto.

---

## Estado final

**PASS.** Fecharam-se os pendentes técnicos da Fase 6 que não dependem de
credenciais externas:

- **E2E de estados de evento** (rascunho / cancelado): implementado e verde.
- **Manutenção com provider ativo**: coberta por duplos controlados (filas,
  backoff, resiliência do lote, lease/mutex).
- **Acessibilidade aprofundada** (axe-core já presente + verificações manuais):
  3 defeitos de contraste reais corrigidos; auditoria agora **sem violações
  critical/serious** em todas as páginas do módulo.
- **Segurança**: reconfirmada ausência de segredos em HTML, storage, Cache
  Storage e respostas.
- **RLS / permissões**: revistas por leitura das migrations; sem lacunas — **não
  foi necessária migration nova**.

Ficam pendentes **apenas** os itens que exigem credenciais Stripe TEST reais e a
Stripe CLI (nenhuma disponível nesta máquina) — ver "O que falta antes de Stripe
Live".

---

## 1. Stripe Test Mode real

Verificação segura (nomes e formato; nunca valores):

| Variável | Estado |
|---|---|
| `ESPECTACULOS_STRIPE_MODE` | **não definida** |
| `ESPECTACULOS_STRIPE_ENABLED` | **não definida** |
| `ESPECTACULOS_STRIPE_SECRET_KEY` | **não definida** |
| `NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY` | **não definida** |
| `ESPECTACULOS_STRIPE_WEBHOOK_SECRET` | **não definida** |

Procura em `.env`, `.env.local`, `.env.development(.local)`, `.env.test(.local)`:
**nenhuma chave `STRIPE` em nenhum ficheiro**. Nenhuma chave `sk_live_` /
`pk_live_` / `rk_live_` presente. `stripeConfigured()` devolve `false`; o módulo
de pagamentos está inerte.

**Stripe real test: NÃO executado — razão concreta: não existem credenciais
Stripe TEST configuradas localmente.** Conforme o plano, a fase não bloqueou: a
lógica de pagamentos continua validada por duplos, sem contacto com a Stripe.

Cobertura por duplos (inalterada desde a Fase 6, reconfirmada):
`lib/espectaculos/stripe-flows.test.ts` (14) + `app/api/espectaculos/payments/
webhook/route.test.ts` (12) — PaymentIntent sucesso, cartão recusado, 3DS,
processing/pending, cancelamento, sucesso tardio delegado ao SQL, refund
parcial/total, dispute→review, metadata errada, amount errado, destination/fee,
objeto `livemode` rejeitado, chave/objeto live recusados.

Os cenários que **só** se podem provar contra a Stripe test API real (3DS
interativo, timeouts reais, disputes reais, webhooks assinados pela Stripe)
ficam listados nos pendentes.

## 2. Webhook real local com Stripe CLI

`which stripe` → **não instalado**. Conforme o plano, **não foi instalado
automaticamente**.

**Stripe CLI: NÃO executado — razão concreta: CLI ausente e, mesmo que
instalada, não haveria credenciais TEST para `stripe listen`.**

O endpoint `/api/espectaculos/payments/webhook` continua coberto ao nível da rota
por `route.test.ts` (12 testes, Fase 6): assinatura válida/ inválida, body
demasiado grande (declarado e real), `livemode`/connected-account recusados,
evento desconhecido → 204, duplicado/idempotente → 204 sem reprocessar, falha
transitória → 503 recuperável, sem segredos no corpo das respostas. Nada foi
encaminhado para produção; nenhum processo `stripe listen` foi iniciado (logo,
nenhum órfão).

## 3. E2E de estados de evento (rascunho / cancelado)

`tests/espectaculos/estado-eventos.spec.ts` (2 specs, PASS) + fixtures novas em
`scripts/espectaculos/e2e/fixture-server.mjs`.

Fixtures acrescentadas, a espelhar o SQL real:
- `id=2` estado `rascunho`; `id=3` estado `cancelado` com sessão `status='cancelled'`.
- `event_upcoming` → só `estado='publicado'` (migration `…103000`, linha 4).
- `event_public_detail` → só `estado in ('publicado','cancelado')` (migration
  `…120000`, linha 12); rascunho devolve `null`.
- `event_reserve` → recusa qualquer `p_session` cujo evento não esteja
  `publicado`, com `Sessão indisponível.` (migration `…102000`, linha 53).

| Verificação | Resultado |
|---|---|
| Rascunho **não aparece** na agenda pública | PASS |
| Detalhe do rascunho **não é acessível** (página "não encontrado"; sem `<h2>Sessões e bilhetes>`, sem botão de reserva, sem seletor de quantidade) | PASS |
| Cancelado **continua endereçável** (`/espectaculos/eventos/3` responde 200 e mostra o evento) | PASS |
| Estado cancelado **claramente apresentado** — banner `role="status"` "Evento cancelado…" e sessão marcada "Cancelada" | PASS |
| Venda/reserva **não permitida** no cancelado — sem botão "Registar participação", sem `spinbutton`; a RPC `event_reserve` para a sessão cancelada devolve **400 "Sessão indisponível."** | PASS |

Nota `next dev`: `notFound()` responde **200** em dev (404 só em `next build`+
`start`) — o teste aceita ambos desde que o conteúdo seja a página de "não
encontrado" e nada do evento/venda esteja acessível.

Não houve alteração de comportamento funcional da aplicação nesta secção (só
fixtures de teste).

## 4. Manutenção com provider ativo

`lib/espectaculos/maintenance-provider.test.ts` (5 testes, PASS) — exercita o
ramo de `runMaintenance` com `stripeConfigured() === true`, que a Fase 5/6 não
cobria. Duplos controlados do cliente admin e do SDK Stripe; sem rede.

| Item do plano | Verificação | Resultado |
|---|---|---|
| `event_payments` / `event_refunds` / `event_payment_events` pendentes | as três filas são lidas com `LIMIT` e drenadas; `result` = `{events:1,refunds:1,payments:1}` | PASS |
| `next_reconcile_at` + `attempts` + backoff | update escreve `next_reconcile_at` com `30s·2^(attempts-1)` (≈30 s à 1ª tentativa, ≈240 s à 4ª) e incrementa a coluna certa por tabela (`attempts` em `event_payment_events`, `reconcile_attempts` nas outras) | PASS |
| Retry / sucesso | tarefa de dispute processa e marca `status='processed'`; pagamento reconciliado chama `event_settle_payment` | PASS |
| Falha transitória | uma tarefa que rebenta conta como `pendingReview++` **sem abortar o lote**; a tarefa seguinte corre na mesma; ambas ficam reagendadas para retry | PASS |
| Falha definitiva / review | `pendingReview` acumula; `logOperation` regista `outcome:'failed'` com `retryCount` | PASS |
| Mutex de manutenção / lease | sem lease (`event_maintenance_claim` → `null`) → `{busy:true}`, **nenhum** trabalho, **nenhuma** tentativa de `release` | PASS |
| Lease sempre libertado | em sucesso **e** quando `event_expire_reservations` falha (erro visível `Manutenção pendente.`), `event_maintenance_release` é chamado com o token | PASS |
| Nenhum loop infinito | `for…of` sobre um array finito de tarefas + `break` quando `Date.now()+12000 ≥ deadline` (revisão por construção; `interrupted` sinaliza o corte) | Revisto |

## 5. Acessibilidade

Ferramenta: **axe-core 4.13.0** (já em `node_modules` como dep. transitiva — não
foi instalada nada) injetada via `page.addScriptTag`, tags WCAG 2.0/2.1 A + AA,
em `tests/espectaculos/a11y.spec.ts` (6 specs). Barra: zero violações
`critical`/`serious`. Resultados completos por página em
`/tmp/otj-espectaculos-e2e-results/a11y-*.json`.

**Defeitos reais encontrados e corrigidos (contraste, WCAG 1.4.3 AA):**

| Elemento | Antes | Depois |
|---|---|---|
| `app/espectaculos/page.tsx` — rótulos "Agenda OTJ" / "Evento selecionado" / links "As minhas encomendas" / "Bilheteira" (`text-rose-600` sobre fundo claro) | 4.48:1 | `text-rose-700` → ~6.5:1 |
| `app/espectaculos/page.tsx` — CTA "Ver eventos" (`bg-rose-500`, texto branco) | 3.67:1 | `bg-rose-600 hover:bg-rose-500` → 4.83:1 |
| `components/espectaculos/ticket-selector.tsx` — "N disponíveis" e nota "Reserva de 15 minutos…" (`text-slate-500`) | 4.36:1 | `text-slate-600` → ~7:1 |

**Auditoria por página (após correções):**

| Página | axe critical/serious | Verificações manuais |
|---|---|---|
| Agenda `/espectaculos` | 0 | `<h1>` presente; landmarks; chips de filtro navegáveis |
| Detalhe `/espectaculos/eventos/1` | 0 | banner de estado em `role="status"`; headings hierárquicos |
| Checkout `/espectaculos/checkout/{id}` | 0 | **nenhum** controlo interativo sem nome acessível (varrido no DOM); inputs com label/aria |
| Bilhete `/espectaculos/bilhetes/{id}` | 0 | `img` do QR com `alt`; botão imprimir com nome; sem overflow mobile (Fase 6) |
| Scanner `/…/sessoes/1/checkin` | 0 | feedback em `role="status"` (live region); campo com label; foco alcança o campo por teclado |
| Dashboard organizador `/…/eventos/1` e `/…/operacao` | 0 | `<h1>` presente; estado de erro com heading |

Overflow horizontal mobile (390×844) já coberto em `flows.spec.ts` (Fase 6).
Mensagens de erro/loading e pt-PT já cobertas em `flows.spec.ts` (recusas de
check-in) e nesta bateria.

## 6. Segurança

Reconfirmado (assertivo em `a11y.spec.ts › bilhete` e `flows.spec.ts`):

Varrimento no browser da página do bilhete emitido — DOM (`outerHTML`),
`localStorage`, `sessionStorage` e `Cache Storage` (`caches.keys()`) — por:
`token_hash`, prefixo de QR token `otj1_`, `lease_token`, `client_secret`,
`sk_test_`, `sk_live_`, `whsec_`, `service_role` → **nenhum presente**.
`localStorage.length + sessionStorage.length === 0`.

- `Cache-Control` da página do bilhete: `no-store` / `no-cache` + `must-revalidate`
  (não armazenável em cache partilhada, revalidação obrigatória).
- Scanner: `localStorage + sessionStorage` vazios após ciclo completo de leitura
  (Fase 6).
- Logs sanitizados: `operation-log.ts` só emite IDs técnicos + códigos de estado;
  `notification-worker`/`maintenance-route`/`webhook route` testes afirmam que
  exceções com segredos/PII são reduzidas a códigos.
- Servidor E2E: env limpa + `network-guard` (nenhuma saída externa) + fonte Google
  mockada.

Nenhum segredo é impresso neste relatório nem foi exposto durante a fase.

## 7. RLS / Permissões

Revisão local das migrations `…102000`, `…103000`, `…120000`, `…130000` (sem
tocar no Supabase remoto). Todas as funções são
`security definer set search_path = ''`, com `revoke all … from public,anon
[,authenticated]` seguido de `grant execute` mínimo.

| Papel | Regra no SQL | Confirmação |
|---|---|---|
| `owner` / `admin` | acesso completo em todas as RPC de organização | E2E `flows.spec.ts` (resumo operacional visível) |
| `finance` | `event_sales_summary` / `event_operational_summary`: campos financeiros incluídos (`is_event_org_member(org, {owner,admin,finance})`); `event_request_refund` restrito a `{owner,admin,finance}` | leitura SQL |
| `manager` | `event_sales_summary`: acesso sim, **flag `financial` = false** ⇒ `gross_cents`/`refunds_cents`/`net_before_provider_cents` **ausentes** do JSON; `event_operational_summary` recusa (`{owner,admin,finance}`) | E2E `flows.spec.ts` (sem "Receita bruta", sem "Estado operacional", `/operacao` → erro de permissão) |
| `checkin` | apenas `event_checkin` / `event_checkin_feedback` / `event_queue_notification` (`{owner,admin,checkin}`); scanner não devolve PII do comprador | E2E `flows.spec.ts` (7 recusas sem detalhes do comprador) |
| utilizador externo | RPC públicas só leem `estado='publicado'`; `event_orders` limitado a `buyer_id=auth.uid()`; rotas privadas → `/login` | E2E `flows.spec.ts` + `estado-eventos.spec.ts` |

**Grants mínimos confirmados**: `anon,authenticated` só nas RPC públicas
(`event_upcoming`, `event_public_detail`, `event_public_availability`,
`event_availability`); `authenticated` nas ações de utilizador
(`event_reserve`, `event_confirm_free`, `event_checkin`, `event_request_refund`,
`event_*_summary`, `event_checkin_feedback`); `service_role` nas internas
(`event_settle_*`, `event_bind_payment`, `event_expire_reservations`,
`event_maintenance_*`, `event_notification_*`).

**Nenhuma lacuna encontrada ⇒ nenhuma migration nova nesta fase.** (Se viesse a
ser necessária, o timestamp seguinte livre seria
`20260907150000_espetaculos_fase7_*.sql`.)

## 8. Ficheiros alterados

Aplicação (correções de contraste — cosméticas, sem alteração de comportamento):

```
 app/espectaculos/page.tsx                     text-rose-600→700 (4×); CTA bg-rose-500→600
 components/espectaculos/ticket-selector.tsx   text-slate-500→600 (2×)
```

Infra de teste E2E:

```
 scripts/espectaculos/e2e/fixture-server.mjs   +draftEvent/+cancelledEvent/+cancelledSession;
                                               event_upcoming/event_public_detail/
                                               event_public_availability/event_reserve espelham o SQL de estado
```

Testes novos:

```
 tests/espectaculos/estado-eventos.spec.ts        2 specs — rascunho ausente/inacessível, cancelado endereçável/sem venda
 tests/espectaculos/a11y.spec.ts                  6 specs — axe-core WCAG 2 A/AA + verificações manuais
 lib/espectaculos/maintenance-provider.test.ts    5 testes — runMaintenance com provider ativo
 docs/espectaculos/FASE7-STRIPE-TEST-VALIDACAO-PRE-PRODUCAO.md   este relatório
```

Ainda por versionar da Fase 6 (inalterados nesta fase):
`scripts/espectaculos/e2e/{next-server,start}.mjs`, `tests/espectaculos/flows.spec.ts`,
`next.config.js`, `playwright.espectaculos.config.ts`, `tsconfig.json`, `.gitignore`,
`app/api/espectaculos/payments/webhook/route.test.ts`,
`docs/espectaculos/FASE6-E2E-STRIPE-PREPARACAO-PRODUCAO.md`.

Preservado sem toque: `lib/espectaculos/operation.test (conflicted copy …).ts`
(ficheiro alheio; não recolhido pelo vitest).

## 9. Migrations novas

Nenhuma.

## 10. Comandos executados e resultados

| Comando | Resultado |
|---|---|
| verificação segura das 5 variáveis `ESPECTACULOS_STRIPE_*` | todas **não definidas**; sem chaves live |
| `which stripe` | **não instalado** |
| `npx vitest run lib/espectaculos app/api/espectaculos` | **88 passed / 0 failed** (10 ficheiros) |
| `npx playwright test --config=playwright.espectaculos.config.ts` | **12 passed / 0 failed** (Chromium via Google Chrome do sistema); todas as auditorias a11y "violações axe: nenhuma" |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx eslint <ficheiros alterados da Fase 7>` | **PASS** (exit 0, 0 avisos) |
| `git diff --check` | **limpo** |
| `npm run build` | **PASS** (exit 0, Turbopack) |
| testes SQL locais | n/a (sem SQL novo) |

Detalhe da bateria Playwright (12):
`a11y.spec.ts` 6 (agenda/detalhe, checkout, bilhete, scanner, dashboard) ·
`estado-eventos.spec.ts` 2 · `flows.spec.ts` 4 (agenda+login, compra+QR mobile,
permissões de organização, scanner QR real + recusas).

## 11. Riscos

- **Sem prova real de Stripe** — toda a integração de pagamentos e o webhook
  continuam validados apenas por duplos. O comportamento contra a Stripe test API
  (3DS interativo, latências reais, disputes, retries do webhook) não está
  exercido ponta-a-ponta.
- **Cobertura E2E sobre fixtures**, não Postgres/RLS reais — regressões que só
  surjam com RLS/RPC reais não são apanhadas por esta bateria (dependem dos
  testes SQL das fases anteriores e de validação em staging).
- **`next dev` no servidor E2E** — `notFound()` responde 200 e o `Cache-Control`
  difere do `next start` de produção; os testes toleram ambos, mas a prova de
  status 404 real fica para uma execução contra build de produção.
- **Contraste de marca** — corrigidos os 3 pontos que falhavam AA nas páginas de
  Espetáculos; o resto do site (fora de âmbito) não foi auditado.
- **axe-core é dep. transitiva** — se desaparecer do lockfile, `a11y.spec.ts`
  falha a carregar `node_modules/axe-core/axe.min.js` até ser adicionada como
  devDependency explícita.

## 12. Pendentes

1. **Stripe TEST real** — obter `sk_test_` / `pk_test_` / `whsec_…` de uma conta
   de teste e correr, só em test mode, com cartões oficiais: PaymentIntent
   sucesso, `4000000000000002` (recusado), `4000002500003155` (3DS),
   processing/pending, cancelamento, sucesso tardio após expiração, refund
   parcial e total, dispute/review, metadata/amount/destination/application-fee
   errados, objeto `livemode` recusado.
2. **Webhook real com Stripe CLI** — instalar a CLI (decisão do utilizador),
   `stripe listen --forward-to 127.0.0.1:<porta>/api/espectaculos/payments/webhook`
   (nunca produção), validar assinatura real, duplicação, retry após 503,
   `payment_intent`/`refund`/`dispute`, rejeição de `livemode`, e ausência de
   segredos nos logs; não deixar `stripe listen` órfão.
3. **E2E contra build de produção** — repetir `estado-eventos` com
   `next build`+`next start` para provar o **404 real** do rascunho e o
   `Cache-Control` de produção do bilhete.
4. **Auditoria a11y ao resto do site** — fora do âmbito de Espetáculos.

## 13. O que falta antes de Stripe Live

1. Concluir os pendentes 1–3 (Stripe test real + webhook via CLI + E2E de
   produção).
2. **Relaxar explicitamente `stripeConfigured()`** — hoje recusa tudo o que não
   seja `mode=test` + chaves `*_test_`; ativar live exige alterar essa função e
   rever a lógica de recusa de objetos `livemode` no webhook.
3. Provisionar credenciais **live** apenas em env seguro (Vercel), nunca no
   repositório; `ESPECTACULOS_STRIPE_MODE=live`, `…_ENABLED=true`.
4. Registar o endpoint de webhook de produção na dashboard Stripe e guardar o
   `whsec_…` de produção como env.
5. `ESPECTACULOS_QR_KEY_V1` de produção (distinta da de dev).
6. Configurar o scheduler de manutenção em produção (cron Vercel →
   `/api/espectaculos/maintenance` com `ESPECTACULOS_MAINTENANCE_SECRET`).
7. Validar RLS/grants `event_*` contra papéis reais em staging com dados reais.
8. Ativar transporte de email real (SendGrid; hoje pausado por domínio —
   `docs/pendentes/SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md`).
9. Teste de carga ao check-in e ao webhook (idempotência sob concorrência).

---

## Anexo — bloqueio crítico

**Nenhum bloqueio crítico.** Todos os itens da Fase 7 que não dependem de
credenciais externas estão fechados e verdes. Os pendentes 1 e 2 dependem
exclusivamente de credenciais Stripe TEST e da Stripe CLI, indisponíveis nesta
máquina.
