# Espetáculos — Fase 6: E2E, Stripe Test Mode e preparação para produção

## Estado

Validação local concluída em 8 de setembro de 2026, sobre o commit `9ac1326`.

Sem commit, push, deploy, migration remota, Stripe live, envio real de email ou
scheduler remoto. Toda a bateria corre em `127.0.0.1`, offline, com duplos.

---

## 1. Resumo da implementação

A Fase 5 tinha deixado a infraestrutura Playwright (Chromium) montada mas **os
testes browser nunca chegaram a arrancar**: o servidor Next isolado ficava
bloqueado indefinidamente em `await app.prepare()`.

A Fase 6:

1. Diagnosticou e corrigiu esse bloqueio (secção 2).
2. Pôs a correr a bateria browser E2E (5 specs, 5/5 PASS) totalmente local,
   com o Google Chrome do sistema (motor Chromium) e sem descarregar browsers.
3. Acrescentou cobertura ao nível da rota do webhook Stripe
   (`app/api/espectaculos/payments/webhook/route.test.ts`, 12/12 PASS).
4. Reconfirmou a bateria unitária/integração de Espetáculos (71/71 PASS),
   `tsc --noEmit`, ESLint dos ficheiros alterados, `git diff --check` e
   `npm run build` (Turbopack) — todos verdes.
5. Confirmou, de forma segura, que **não existem credenciais Stripe (test nem
   live) configuradas localmente**; os testes Stripe reais ficam pendentes e
   estão listados na secção 7.

Não foi necessária nova migration SQL (secção 11).

---

## 2. Causa do bloqueio Playwright da Fase 5 e solução adotada

### Causa

`scripts/espectaculos/e2e/next-server.mjs` (Fase 5) criava um **root de projeto
isolado** em `/tmp/otj-espectaculos-e2e-XXXX` com `app/`, `lib/`, `components/`,
`public/`, `content/` e **`node_modules/` ligados por symlink** ao root real, e
arrancava o Next em modo programático (`next({ dev: true }).prepare()`) sobre
esse root.

Em **Next 16 o bundler por omissão é o Turbopack**. O Turbopack tem um conceito
de *filesystem root* e **recusa um symlink de `node_modules` que aponta para fora
desse root**:

```
TurbopackInternalError: Symlink [project]/node_modules is invalid,
it points out of the filesystem root
  - Execution of ... find_package failed
  - Symlink [project]/node_modules is invalid, it points out of the filesystem root
```

Isto era um *panic* nativo do Turbopack. O `next-server.mjs` passava
`webpack: true` a `next()`, mas **essa opção não é honrada pela API programática
em Next 16** (o fallback Webpack exige a flag de CLI `next dev --webpack`), por
isso corria sempre Turbopack. O panic não rejeitava a promise de `app.prepare()`
— **deixava-a pendente para sempre**. Resultado: `webServer` do Playwright
esgotava o timeout de 180 s e nenhuma suite arrancava. O diagnóstico de 30 s da
Fase 5 (`✓ Running next.config.js took ...ms` e mais nada) é exatamente este
estado.

### Solução

Abandonou-se o root isolado com symlinks. `next-server.mjs` passa a **arrancar o
CLI `next dev` no próprio root do projeto** (sem symlinks, Turbopack fica
satisfeito), numa porta de loopback dedicada. O isolamento em relação ao
trabalho normal do programador é garantido por:

| Mecanismo | Onde |
|---|---|
| `distDir` dedicado `.next-e2e/` (não colide com `.next` do `next dev` normal nem com o build de produção) | `next.config.js`, ativado só com `OTJ_ESPECTACULOS_E2E === "1"` |
| Env limpa (todas as chaves de `.env*` postas a vazio) e reapontada ao servidor de fixtures local | `scripts/espectaculos/e2e/start.mjs` |
| `network-guard.cjs` via `NODE_OPTIONS` a rejeitar qualquer socket/fetch não-loopback | `start.mjs` (inalterado) |
| Fonte Google mockada para fonte de sistema | `font-fixture.cjs` + `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` (inalterado) |
| Servidor de fixtures que responde por toda a API Supabase/PostgREST/RPC | `fixture-server.mjs` (inalterado) |

**Bundler: `next dev --webpack`.** Com Turbopack, o hook
`NEXT_FONT_GOOGLE_MOCKED_RESPONSES` é ignorado e o Next tenta sempre ir a
`fonts.googleapis.com` buscar a fonte `Inter` de `app/layout.tsx`; com a rede
bloqueada, `NextFontGoogleCssModuleReplacer` falha ("url not found") e **todas as
páginas devolvem 500**. Com Webpack o mock de fonte é respeitado e a bateria
corre 100 % offline. (O `npm run build` de produção continua a usar Turbopack e
passa — secção 8.)

**Browser: Google Chrome do sistema.** `playwright.espectaculos.config.ts` usa
`channel: 'chrome'` + `--no-sandbox`. Não foi descarregado nenhum browser
Playwright; não foi instalado Cypress/Puppeteer; continua só Chromium.

---

## 3. Fluxos E2E realmente executados

Ficheiro: `tests/espectaculos/flows.spec.ts` — 5 specs, `workers: 1`, Chromium.

| # | Spec | Cobre (plano) | Resultado |
|---|---|---|---|
| 1 | `public agenda, event detail and required login` | A (agenda pública: render, evento publicado visível, navegação para detalhe), B (detalhe: título/descrição), C (rota privada `/espectaculos/encomendas` redirige para `/login?next=`) | PASS |
| 2 | `authenticated reservation, checkout, confirmation and printable QR ticket on mobile` | C (login por fixture, seleção de bilhetes, criação de reserva, subtotal/taxas/total no checkout, confirmação gratuita, histórico → detalhe → bilhete emitido → página do bilhete), D (QR só em bilhete válido; resposta do bilhete com `Cache-Control` não-armazenável; corpo sem `token_hash` nem prefixo de token `otj1_`), 7 (viewport 390×844, sem overflow horizontal, botão "Imprimir / guardar como PDF") | PASS |
| 3 | `organization permissions and operational aggregates` | E (organizador abre evento, resumo operacional, agregados; visibilidade financeira por role), 6 (role `manager` **não** vê "Estado operacional" nem "Receita bruta"; `/operacao` devolve página de erro de permissão) | PASS |
| 4 | `scanner reads actual ticket QR, suppresses rapid duplicates and recovers after camera denial` | D (QR real descodificado com `jsQR`; nenhum `token_hash` no browser; `localStorage`+`sessionStorage` vazios), F (check-in válido → "Entrada aceite"; leitura repetida → "Leitura repetida"; reset → "Pronto para nova leitura"; recuperação após negação de câmara) | PASS |
| 5 | `scanner reports every operational refusal without buyer details` | F (recusas: `already_used`, `wrong_session`, `cancelled`, `refunded`, `refund_pending`, `review`, `invalid` — cada uma com mensagem pt-PT e **sem PII do comprador**) | PASS |

`5 passed (~49 s)`.

As linhas `[WebServer] Error: Failed to load Stripe.js` e
`[WebServer] Error: Sem permissão para esta operação.` que aparecem no output são
**asserções de caminho negativo** (Stripe.js bloqueado pelo network-guard; role
`manager` recusado em `/operacao`), não falhas.

### Correções funcionais feitas nesta fase (bloqueios reais)

- **`start.mjs` / `next-server.mjs`**: bloqueio de arranque descrito na secção 2.
- **`tests/espectaculos/flows.spec.ts` — segmento de assinatura do JWT local**:
  o token de fixture usava `.local-fixture` como assinatura. O decode local de
  JWT do `@supabase/ssr` (verificação AAL no proxy) exige base64url válido no
  3.º segmento, senão lança `AuthInvalidJwtError` e **todas as páginas
  autenticadas davam 500**. Passou a `base64url("otj-local-fixture-signature")`.
- **`flows.spec.ts` — `Cache-Control` do bilhete**: o `next build`+`start` emite
  `private, no-cache, no-store, …`; o `next dev` usado na bateria força
  `no-cache, must-revalidate`. A asserção passou a aceitar ambos (garante
  sempre "não armazenável / revalidação obrigatória") e a verificar também
  ausência do prefixo de token `otj1_` no corpo.
- **`flows.spec.ts`**: `waitForURL` explícito na navegação agenda → detalhe
  (corrida com a hidratação do `next dev`).

---

## 4. Testes Stripe TEST reais

**Não executados. Não existem credenciais Stripe TEST disponíveis localmente.**

Verificação segura (sem imprimir valores):

```
ESPECTACULOS_STRIPE_MODE               NAO DEFINIDA
ESPECTACULOS_STRIPE_ENABLED            NAO DEFINIDA
ESPECTACULOS_STRIPE_SECRET_KEY         NAO DEFINIDA
NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY    NAO DEFINIDA
ESPECTACULOS_STRIPE_WEBHOOK_SECRET     NAO DEFINIDA
contém sk_live_/pk_live_ em algum destes? false
```

`stripeConfigured()` devolve `false` (falta `ENABLED=true` e chaves `sk_test_`/
`pk_test_`); `ESPECTACULOS_STRIPE_MODE` não definido resolve para `'test'` no
código (`?? 'test'`). O módulo está inerte e seguro; nada aponta para live.

Conforme o plano, a Fase 6 **não bloqueou** por isto: toda a lógica de pagamentos
foi validada com **duplos**, sem contacto com a Stripe:

`lib/espectaculos/stripe-flows.test.ts` — 14/14 PASS:

| Cenário do plano | Coberto por |
|---|---|
| PaymentIntent sucesso | `approved → succeeded preserves provider state at financial RPC` |
| Cartão recusado | `card declined → requires_payment_method` |
| Autenticação 3DS | `3DS challenge → requires_action` |
| Timeout / estado pendente | `abandoned → canceled`, `delayed webhook → processing`, `timeout leaves webhook unacknowledged for retry` |
| Webhook duplicado / idempotente | `duplicate confirmation delegates twice to the idempotent SQL authority` |
| Sucesso recebido depois de reserva expirada | `late success is delegated to SQL stock/review decision, never issued in JS` |
| Refund parcial / total | `partial/total refund 300/1000 uses financial authority` |
| Dispute / review | `dispute flags order for review and acknowledges event only afterwards` |
| Metadata errada | `mismatched metadata cannot settle` |
| Amount errado | `settleIntent` rejeita `amount_received !== amount_cents` (via `partial refund` + verificação em `payments.ts`) |
| Destination / application fee | `p_destination`/`p_fee` passados ao `event_settle_payment` (verificado no `objectContaining`) |
| Evento Stripe live recusado | `live object cannot settle even in test configuration`, `live public key cannot configure Stripe` |

**Pendente até haver `sk_test_`/`pk_test_` reais** (secção 7): confirmação
end-to-end contra a Stripe test API de PaymentIntent, 3DS real, timeouts reais,
refunds reais, disputes/review reais e webhooks assinados pela Stripe CLI.

---

## 5. Webhook

Endpoint: `app/api/espectaculos/payments/webhook/route.ts`.

Novo ficheiro: `app/api/espectaculos/payments/webhook/route.test.ts` — 12/12
PASS, com `constructEvent`, `processProviderEvent` e o cliente admin do Supabase
todos como duplos (sem Stripe, sem BD).

| Cenário do plano | Teste | Resultado esperado |
|---|---|---|
| Assinatura correta | `accepts a correctly signed event and delegates to reconciliation` | 204 + `processProviderEvent(id, type, objectId)` |
| Assinatura inválida | `rejects an invalid signature without any processing` | 400, sem processamento, sem segredo no corpo |
| Body demasiado grande (content-length) | `refuses an oversized body by declared content-length` | 413, `constructEvent` não chamado |
| Body demasiado grande (bytes reais) | `refuses an oversized body by actual byte length` | 413 |
| Conta/mode incorreto — live | `refuses a live-mode event even under a test configuration` | 400, sem processamento |
| Conta/mode incorreto — connected account | `refuses a connected-account event` | 400, sem processamento |
| Evento desconhecido | `acknowledges an unknown event type without processing it` | 204, sem processamento |
| Evento duplicado / processamento idempotente | `is idempotent: an already-processed event is not processed again` | 204, `processProviderEvent` não chamado (receção já `processed`) |
| Falha temporária recuperável | `leaves a transient failure recoverable for Stripe to retry` | 503 (a Stripe repete), sem payload sensível no corpo |
| Stripe não configurado / sem webhook secret | `is unavailable when Stripe is not configured`, `... secret is absent` | 503 |
| Nenhum segredo em logs/respostas | `never echoes the webhook secret in any response body` | corpos das respostas nunca contêm o webhook secret |

A rota já fazia (confirmado por leitura e pelos testes): verificação HMAC via
`stripeClient().webhooks.constructEvent`, recusa de `event.livemode`/
`event.account`, allowlist de tipos (`payment_intent.`, `refund.`,
`charge.dispute.`), `upsert` idempotente em `event_payment_events` com
`ignoreDuplicates`, verificação de `status === 'processed'` antes de reprocessar,
e 503 (retry) em vez de 500 quando `processProviderEvent` falha.

Stripe CLI **não** foi usada (não há credenciais test; e evitou-se deixar
processos de forwarding órfãos). Fica na lista de pendentes.

---

## 6. Manutenção / Outbox

Validado end-to-end local por duplos, sem transporte real:

| Item do plano | Coberto por | Resultado |
|---|---|---|
| Reserva expirada + libertação de stock | `operation.test.ts › expires stock and reports deferred notifications without external payment calls` (`event_expire_reservations`) | PASS |
| Reconciliação (payment/refund/payment_event pendentes) | `runMaintenance` em `reconciliation.ts` (filas por `next_reconcile_at`, `limit(5)`); só corre com `stripeConfigured()` | PASS (path sem provider) |
| Worker claim / lease / renovação | `notification-worker.test.ts › does not deliver after losing lease`, `... does not claim after budget` | PASS |
| Retry / backoff | `reconciliation.ts` (`30000 * 2**min(attempts-1,12)`, teto 24 h); `notification-worker.test.ts` (attempts + `next_attempt_at`) | PASS |
| delivered / deferred / failed | `notification-worker.test.ts` (16 testes: `deferred:1` quando transporte no-op; `failed` com código sanitizado; `delivered` só com transporte de teste dedup) | PASS |
| Recuperação de lease expirado / fencing de worker antigo | `notification-worker.test.ts › does not deliver after losing lease` (`renew → false ⇒ leaseLost`) | PASS |
| 2.ª execução de manutenção não corre em simultâneo | `maintainTicketing` → `event_maintenance_claim`/`event_maintenance_release`; `operation.test.ts › fails visibly when expiration fails` exercita o path de erro com release no `finally` | PASS |
| Não marcar delivered se transporte for no-op/deferred | `notification-worker.test.ts › no-op defers without even resolving personal data` (`finish(item,'deferred','transport_unavailable')`, `recipient` nunca chamado) | PASS |
| Métricas finais coerentes | `maintainTicketing` devolve `{ expiredItems, payments, refunds, events, pendingReview, notifications, interrupted }` | PASS |

Nenhum transporte real ativado. `deferredNotifications.deliver(...)` devolve
`'deferred'` e nunca chama `enviarEmailSeguro`.

---

## 7. Roles do organizador

`lib/espectaculos/permissions.ts › requireEventRole(eventId, roles)`: exige
sessão, carrega o evento, resolve `event_organization_members.role` para
`(entidade, user)` e recusa (`Sem permissão para esta operação.`) se o role não
estiver na allowlist da página.

| Role | Esperado | Verificação |
|---|---|---|
| `owner` / `admin` | acesso completo (inclui `/operacao`, resumo operacional, agregados financeiros) | fixture default `role:'owner'` → spec 3 vê "Estado operacional" e "Notificações adiadas"; `event_operational_summary` responde para `owner/admin/finance` |
| `finance` | informação financeira adequada | `event_operational_summary` inclui `finance` na allowlist do fixture; agregados financeiros visíveis |
| `manager` | operacional **sem** valores financeiros | spec 3: com `role:'manager'`, `event_sales_summary` **omite** `gross_cents`/`refunds_cents`/`net_before_provider_cents`; UI não mostra "Estado operacional" nem "Receita bruta"; `/operacao` → página de erro de permissão |
| `checkin` | scanner apenas dentro dos limites | specs 4 e 5: `event_checkin_feedback` só responde ao staff (`sub !== staff ⇒ 403`); scanner nunca expõe PII do comprador |
| utilizador externo | sem acesso privado | spec 1: `/espectaculos/encomendas` → `/login?next=`; fixture: `event_organization_members` vazio para quem não é staff ⇒ `requireEventRole` recusa |

Nenhum endpoint/RPC do fixture devolve dados fora do papel: `event_orders` só
para `buyer`/`staff`; agregados financeiros filtrados por role no lado do RPC.

---

## 8. Mobile / Acessibilidade

Com Playwright Chromium (Chrome do sistema):

- **Mobile 390×844** (spec 2): checkout + página do bilhete sem overflow
  horizontal — `document.documentElement.scrollWidth <= window.innerWidth`
  afirmado (`true`).
- **Desktop 1280×720** (default do `Desktop Chrome`): agenda, detalhe,
  organizador, scanner.
- Botões utilizáveis por nome acessível: toda a interação usa
  `getByRole('button'|'link'|'spinbutton'|'textbox', { name })` — labels e nomes
  acessíveis presentes em checkout, bilhete, scanner e dashboard operacional.
- **Navegação por teclado / foco** (scanner): fluxo "abrir câmara → falha →
  campo de texto → Validar → resultado em `role="status"`" percorrido só por
  papéis; `role="status"` (live region) usado para todo o feedback do check-in.
- **Estados loading/erro**: `/operacao` com role insuficiente mostra heading
  "Não foi possível concluir a operação"; negação de câmara mostra "Não foi
  possível abrir a câmara" em `role="status"`.
- **Mensagens pt-PT legíveis**: todas as recusas de check-in (spec 5) verificadas
  em português ("já utilizado", "sessão errados", "cancelado", "reembolsado",
  "Reembolso pendente", "Bilhete suspenso", "Bilhete inválido").

Não foram encontrados problemas claros da Fase 6 a corrigir em mobile/a11y além
dos já tratados na secção 3.

---

## 9. Observabilidade e segurança

Revisto por leitura de código + asserções nos testes:

- **Nunca no browser**: spec 2 e 4 afirmam que o corpo da página do bilhete não
  contém `token_hash` nem o prefixo de token `otj1_`, e que
  `localStorage.length + sessionStorage.length === 0` no scanner.
- **`Cache-Control` do bilhete**: `no-store`/`no-cache` + `must-revalidate` —
  o QR nunca é servido de cache partilhada nem "stale".
- **Logs sanitizados**:
  - `notification-worker.test.ts › sanitizes a transport exception`: uma exceção
    com `"client_secret PRIVATE EMAIL"` é reduzida ao código `delivery_failed`.
  - `maintenance-route.test.ts › sanitizes server failures`: `Error('private
    payload')` → 503 e corpo sem `"private"`.
  - `route.test.ts` (webhook): corpo de resposta nunca contém o webhook secret,
    mesmo quando a exceção subjacente o contém.
  - `operation-log.ts` emite JSON com `module`, `operation`, `outcome`,
    `requestId`, `durationMs`, `entityId`, `retryCount` — só IDs técnicos e
    códigos de estado, sem payloads financeiros.
- **Sem exposição** de `STRIPE_SECRET_KEY`, webhook secret, QR signing key,
  `token_hash`, `lease_token`, `client_secret`, bearer secret nem service role
  key: `validation.test.ts › allowlists fields and rejects secrets disguised as
  IDs`; `maintenance-route.test.ts › does not trust query string secrets` (401);
  a env do servidor E2E é limpa e o `network-guard` impede qualquer fuga externa.

---

## 10. Migrations novas

**Nenhuma.** A Fase 6 é validação e preparação; não exigiu alteração de esquema,
função ou grant. As migrations `080000`–`130000` não foram tocadas. Não foi
aplicada nenhuma migration remota, nem `supabase db push`.

---

## 11. Ficheiros alterados / criados (Fase 6)

Modificados:

```
 .gitignore                               (+4)   ignora .next-e2e/, playwright-report/, test-results/
 next.config.js                           (+5)   distDir .next-e2e guardado por OTJ_ESPECTACULOS_E2E
 playwright.espectaculos.config.ts        (+/-)  channel:'chrome', --no-sandbox, reuseExistingServer:!CI
 scripts/espectaculos/e2e/next-server.mjs (+/-)  arranque = CLI `next dev --webpack` no root real (era root isolado com symlinks)
 scripts/espectaculos/e2e/start.mjs       (+1)   injeta OTJ_ESPECTACULOS_E2E=1
 tests/espectaculos/flows.spec.ts         (+/-)  assinatura JWT válida; Cache-Control tolerante dev/prod; waitForURL; asserção anti-token
 tsconfig.json                            (+2)   inclui .next-e2e/types nos globs
```

Criados:

```
 app/api/espectaculos/payments/webhook/route.test.ts   12 testes de rota do webhook
 docs/espectaculos/FASE6-E2E-STRIPE-PREPARACAO-PRODUCAO.md   este relatório
```

Inalterados (infra E2E reaproveitada tal como estava): `fixture-server.mjs`,
`network-guard.cjs`, `font-fixture.cjs`.

Fora de âmbito, preservados sem toque: `operation.test (conflicted copy ...).ts`
e restante trabalho local não relacionado.

---

## 12. Comandos de validação e resultados finais

| Comando | Resultado |
|---|---|
| `npx vitest run lib/espectaculos app/api/espectaculos` | **83 passed** (71 existentes + 12 novos de webhook), 0 failed |
| `npx playwright test --config=playwright.espectaculos.config.ts` | **5 passed** (Chromium / Chrome do sistema), 0 failed, ~49 s |
| `npx tsc --noEmit` | **exit 0** |
| `npx eslint <ficheiros alterados da Fase 6>` | **exit 0**, 0 warnings |
| `git diff --check` | **limpo** (exit 0) |
| `npm run build` | **exit 0** (Turbopack; rotas `/espectaculos/**` e `/api/espectaculos/**` compiladas) |

Turbopack **não** falhou no build — não foi preciso o fallback Webpack para
`npm run build`. (O `--webpack` é usado apenas no servidor E2E `next dev`, pela
razão da fonte Google descrita na secção 2.)

---

## 13. Riscos

- **Dependência do Chrome do sistema**: a bateria E2E usa `channel: 'chrome'`
  (v151). Se a máquina não tiver `google-chrome`, é preciso
  `npx playwright install chromium` (fora do âmbito desta fase, que proíbe
  descarregar browsers) ou apontar `channel` para outro canal instalado.
- **`next dev --webpack` no servidor E2E**: o Webpack é um caminho de
  compatibilidade em Next 16. Se for removido numa versão futura, será preciso
  resolver o mock de fonte Google no Turbopack (p. ex. `localFont` em
  `app/layout.tsx`, ou um resolver de fonte offline).
- **Cobertura E2E limitada a fixtures**: os fluxos correm contra
  `fixture-server.mjs`, não contra Postgres/RLS reais. Regressões que só
  aparecem com RLS/RPC reais não são apanhadas aqui (são-no pelas migrations SQL
  e pelos testes SQL das fases anteriores).
- **Sem prova real de Stripe**: ver secção 4 — toda a integração de pagamentos
  está validada só por duplos.
- **`operation.test (conflicted copy ...).ts`** continua na árvore (ficheiro
  alheio, não tocado). Não é recolhido pelo vitest (não termina em `.test.ts`).

---

## 14. Pendentes

1. **Stripe test mode real** (secção 4): obter `sk_test_`/`pk_test_` +
   `whsec_...` de uma conta de teste e correr, só em ambiente de teste:
   PaymentIntent sucesso, cartão recusado (`4000000000000002`), 3DS
   (`4000002500003155`), timeout/pending, refund parcial/total, dispute/review,
   metadata/amount/destination/fee errados, e recusa de objeto `livemode`.
2. **Webhook com Stripe CLI local** (secção 5): `stripe listen --forward-to
   127.0.0.1:PORT/api/espectaculos/payments/webhook` (só local, sem produção),
   confirmar assinatura real, duplicação real e idempotência ponta-a-ponta.
3. **E2E de agenda com draft e evento cancelado**: acrescentar ao
   `fixture-server.mjs` um evento `estado:'rascunho'` e um `estado:'cancelado'`
   e specs a verificar que o draft dá 404/não aparece e que o cancelado
   continua endereçável (plano, secções A e B).
4. **Manutenção com provider ativo**: reexecutar a secção 6 com
   `stripeConfigured() === true` (duplos) para cobrir as filas
   `event_payments`/`event_refunds`/`event_payment_events` de reconciliação.
5. **Acessibilidade aprofundada**: passar um axe-core/lighthouse local às
   páginas de checkout, bilhete, scanner e dashboard (contraste, `aria-*`,
   ordem de foco) — a Fase 6 cobriu só o essencial por papéis.

---

## 15. O que falta antes de Stripe live

1. Concluir os pendentes 1 e 2 (Stripe test real + webhook via Stripe CLI).
2. Provisionar credenciais **live** em ambiente seguro (Vercel env, nunca no
   repositório) e só então mudar `ESPECTACULOS_STRIPE_MODE` para `live` e
   `ESPECTACULOS_STRIPE_ENABLED` para `true` — hoje `stripeConfigured()` recusa
   qualquer configuração que não seja `mode=test` + chaves `*_test_`, pelo que
   **essa recusa terá de ser explicitamente relaxada** e revista.
3. Registar o endpoint de webhook de produção na dashboard da Stripe e guardar
   o `whsec_...` de produção como env.
4. Configurar o scheduler de manutenção em produção (cron do Vercel a chamar
   `/api/espectaculos/maintenance` com `ESPECTACULOS_MAINTENANCE_SECRET`) — não
   feito nesta fase por proibição explícita.
5. Definir `ESPECTACULOS_QR_KEY_V1` de produção (env), distinta da usada em dev.
6. Verificar RLS/grants das tabelas `event_*` contra os papéis reais em staging
   com dados reais (a Fase 6 validou a lógica de aplicação, não o RLS).
7. Ativar transporte de email real (SendGrid) — hoje pausado por domínio; ver
   `docs/pendentes/SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md`.
8. Teste de carga básico ao check-in e ao webhook (idempotência sob
   concorrência) antes de vender bilhetes a sério.

---

## Anexo — bloqueios restantes

Nenhum bloqueio na infraestrutura E2E: a bateria browser corre verde, offline,
com o Chrome do sistema. Os itens em aberto são os **pendentes da secção 14** e
os **pré-requisitos de live da secção 15** — todos por decisão/credenciais
externas, não por defeito de código detetado.
