# AUDITORIA — Base para Implementação da Rede Social (MFA/2FA obrigatório)

**Data:** 2026-08-24
**Projeto:** otiodojoca (plataforma "O Tio do Joca" / almanaque)
**Localização:** `/home/berze/Nextcloud/Projectos/otiodojoca` (computador local do utilizador, sincronizado via Nextcloud)
**Cópia de segurança existente:** `otiodojoca.backup-atual` (não tocada)

Esta auditoria corresponde à FASE 1 + FASE 2 do prompt "PROMPT ÚNICO — IMPLEMENTAÇÃO DE REDE SOCIAL COMPLETA". Nenhum ficheiro foi alterado.

---

## 1. Stack confirmada

```json
"next": "^16.3.1"
"react": "^18.3.1"
"@supabase/ssr": "^0.12.5"
"@supabase/supabase-js": "^2.112.4"
"typescript": "^5.5.2"
"tailwindcss": "^3.4.4"
"supabase" (CLI): "^2.115.0"
```

O Supabase é gerido em **modo declarativo** (`supabase/schemas/*.sql` + `supabase db diff` → `supabase/migrations/`), não migrations SQL escritas à mão soltas. Qualquer alteração ao esquema deve seguir este fluxo (editar `schemas/`, gerar migration com o CLI), não inventar ficheiros de migration manualmente.

## 2. Estrutura do projeto (App Router)

Route groups/módulos já existentes: `(alojamento)`, `(auth)`, `(comer)`, `(freguesia)`, `(freguesias)`, `agenda-agricola`, `almanaque`, `api`, `calendario`, `forum`, `gran-bazar`, `imoveis`, `lup`, `mercado-da-terra`, `parceiros`, `perfil`, `perfil-v2`, `viaturas`.

`lib/supabase/` já existe com `client.ts`, `server.ts`, `middleware.ts` (helper `updateSession`), `admin.ts`, `marketplace.ts`.

## 3. Autenticação atual — GAPS relevantes

1. **Não existe `middleware.ts` na raiz do projeto.** Só existe o helper `lib/supabase/middleware.ts` (`updateSession`), mas nada o invoca. Ou seja, hoje **nenhuma rota é protegida a nível de middleware**.
2. `lib/supabase/client.ts` / `server.ts` / `middleware.ts` usam o padrão **antigo** de cookies (`get`/`set`/`remove`), não o padrão atual recomendado (`getAll`/`setAll`). Isto é o padrão que o Supabase descontinuou por causar bugs de sessão com cookies grandes/chunked.
3. `.env.local.example` usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nomenclatura legada), não `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como assume o prompt novo.
4. `app/(auth)/` só tem `login/` e `registo/` — **não existe pasta `mfa/`**.

## 4. Já existe um sistema de 2FA CUSTOM (não é o MFA nativo do Supabase)

Achado crítico — muda a arquitetura da FASE 5 do prompt:

- `profiles.two_factor_enabled` (boolean, default false)
- `recovery_codes` (id, user_id, code_hash, used) — códigos de recuperação com hash, RLS "own row only"
- `user_sessions` (id, user_id, device, browser, ip, user_agent, last_seen, revoked) — gestão de sessões/dispositivos com revogação

Isto **não é** `auth.mfa_factors` / AAL2 do Supabase Auth — é uma implementação própria por cima da tabela `profiles`. Não sabemos ainda (não vi o código das páginas de login/registo) se `two_factor_enabled` chega a ser aplicado nalgum fluxo, ou se é uma coluna preparada mas não usada.

**Isto é uma decisão de arquitetura, não uma correção técnica** — ver pergunta ao utilizador.

## 5. Já existe uma "rede social" parcial: o fórum

- `threads` (categoria, autor, título, slug, pinned/locked, views, replies_count, search_vector pt) 
- `posts` (thread_id, author_id, content, is_first_post) — **atenção:** este `posts` é post de fórum (resposta a thread), não post de feed social como o prompt novo pede
- `categories`
- Triggers: `handle_new_post`, `notify_thread_author` → alimenta `notifications`
- `notifications` já existe, mas com `type` restrito a `('reply','mention','like')` via CHECK constraint — precisa de ser expandido para `follow`, `comment`, `message`, `group_invitation`, etc.

## 6. Já existe mensagens privadas — mas só no marketplace

`marketplace_conversations`, `marketplace_messages`, `marketplace_message_attachments`, `marketplace_favorites` — sistema de chat funcional, mas acoplado ao marketplace (compra/venda), não genérico.

## 7. Tabelas que a spec da rede social pede e NÃO existem

`follows`, `groups`, `group_members`, `comments` (genéricos, fora do fórum), `reactions`, `conversations`/`conversation_participants`/`messages` genéricos (não ligados ao marketplace), `post_media`.

## 8. Conflitos entre a spec nova e o que já existe (decisões necessárias)

| Tema | Spec nova pede | Estado atual | Decisão necessária |
|---|---|---|---|
| MFA | TOTP nativo Supabase + AAL2 | Sistema custom (`two_factor_enabled` + `recovery_codes`) | Substituir pelo nativo, ou estender o custom? |
| Feed social | `posts`/`comments`/`reactions` genéricos com `visibility` | `posts` já existe mas é resposta de fórum | Novo conjunto de tabelas (ex: `feed_posts`) para não colidir, ou reaproveitar/expandir o fórum? |
| Mensagens | `conversations`/`messages` genéricos | Só existem para marketplace | Criar novo conjunto genérico, ligar o marketplace a ele depois, ou manter os dois separados? |
| Cookies Supabase SSR | `getAll`/`setAll` | `get`/`set`/`remove` (padrão antigo) | Modernizar como parte desta fase (recomendado, e já implícito no prompt) |
| `NEXT_PUBLIC_SUPABASE_*` | `_PUBLISHABLE_KEY` | `_ANON_KEY` | Manter nome atual (compatível) ou migrar nomenclatura |

---

**Não alterei nenhum ficheiro nesta fase de auditoria.** Próximo passo depende das respostas às decisões acima.

---

## 9. Decisões tomadas pelo utilizador

1. **MFA:** substituir o sistema custom (`two_factor_enabled`/`recovery_codes`/`user_sessions`) pelo MFA/TOTP nativo do Supabase Auth + AAL2. As tabelas antigas **não foram apagadas** (não têm UI a usá-las — confirmado nos ficheiros `app/perfil`, `app/perfil-v2` — por isso é seguro deixá-las ficar por agora; podem ser removidas mais tarde numa migration própria).
2. **Feed social:** será um conjunto de tabelas novo e separado do fórum existente (`threads`/`posts`). O fórum continua intacto.

## 10. FASES 3–6 — IMPLEMENTADAS (2026-08-24)

Ficheiros alterados/criados no projeto real (`Projectos/otiodojoca`), todos escritos por completo (não são excertos):

**Modernização Supabase SSR (Fase 3):**
- `lib/supabase/server.ts` — migrado de `get/set/remove` para `getAll/setAll` (padrão atual recomendado pelo Supabase).
- `lib/supabase/middleware.ts` — mesma modernização de cookies **+** lógica de gate AAL2 (ver Fase 6).
- `lib/supabase/client.ts` e `proxy.ts` (raiz) — inspecionados, já estavam corretos, não precisaram de alteração. Confirmado: este projeto usa Next.js 16, que renomeou `middleware.ts` para `proxy.ts` (`export function proxy()` em vez de `export function middleware()`) — o `proxy.ts` já existente estava certo, não era uma lacuna como pensei inicialmente na auditoria.

**Autenticação (Fase 4):**
- `components/auth/login-form.tsx` — após login, verifica o AAL da sessão e encaminha para `/mfa/verify` ou `/mfa/setup` consoante o caso.
- `components/auth/register-form.tsx` — após registo, encaminha sempre para `/mfa/setup` (com fallback para o caso de a confirmação por email vir a ser reativada no futuro).
- `app/(auth)/forgot-password/` + `components/auth/forgot-password-form.tsx` — novo.
- `app/(auth)/reset-password/` + `components/auth/reset-password-form.tsx` — novo.
- `app/(auth)/auth/callback/route.ts` — novo, troca o `code` do link de email por uma sessão (`exchangeCodeForSession`).

**MFA obrigatório (Fase 5):**
- `app/(auth)/mfa/setup/` + `components/auth/mfa-setup.tsx` — novo. Fluxo: `mfa.enroll({factorType:'totp'})` → mostra QR code (SVG) + segredo manual → `mfa.challenge` + `mfa.verify` do código de 6 dígitos. Limpa automaticamente fatores TOTP "unverified" abandonados antes de reiniciar.
- `app/(auth)/mfa/verify/` + `components/auth/mfa-verify.tsx` — novo. Fluxo: `mfa.listFactors()` → `mfa.challenge` + `mfa.verify`.
- `supabase/config.toml` — `[auth.mfa.totp]` `enroll_enabled`/`verify_enabled` passados a `true` (estavam `false`). **Isto só afeta o Supabase local (`supabase start`)** — ver passo manual obrigatório abaixo.

**Middleware + AAL2 (Fase 6):**
- `lib/supabase/middleware.ts` — depois de `getUser()` validar a sessão, chama `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`. Sem fator MFA verificado → redireciona para `/mfa/setup`. Fator verificado mas sessão ainda em AAL1 → redireciona para `/mfa/verify`. Rotas `/login`, `/registo`, `/forgot-password`, `/reset-password`, `/auth/*` ficam sempre públicas. Rotas `/api/*` só têm o refresh de cookies (sem redirect — um redirect HTML quebraria uma resposta JSON; a autorização de cada endpoint continua a ser feita no próprio route handler + RLS, como manda a regra "nunca confiar só no middleware").

### Verificação feita

Não tenho acesso a shell no teu computador, por isso não consegui correr `npm run build`/`npm run dev` diretamente. Em vez disso, montei uma sandbox isolada nesta sessão cloud com as versões **exatas** já instaladas no teu projeto (`next@16.3.2`, `@supabase/ssr@0.12.5`, `@supabase/supabase-js@2.112.4`, mesmo `tsconfig.json`) e corri `tsc --noEmit` sobre todos os ficheiros novos/alterados. Resultado: **0 erros** (encontrei e corrigi um erro de tipos real pelo caminho — `listFactors().totp` só devolve fatores já verificados, o filtro por fatores "unverified" tinha de usar `data.all`, não `data.totp`).

Isto garante que o código compila e os tipos batem certo com as APIs reais do Supabase. **Não substitui** correr a app verdadeira — módulos como `imoveis`, `viaturas`, `gran-bazar`, etc. não foram tocados nem verificados aqui.

### Passos manuais obrigatórios (só tu consegues fazer)

1. **Ativar TOTP no projeto Supabase hosted** (não só no `config.toml` local): Dashboard do Supabase → Authentication → Sign In / Providers → Multi-Factor Authentication → ativar "Authenticator App (TOTP)". Sem isto, `mfa.enroll()` vai falhar em produção mesmo com o código correto.
2. Correr `npm run dev` (ou `npm run build`) localmente para confirmar que o resto da app (todos os outros módulos) continua a compilar sem erros.
3. Testar manualmente o fluxo: registar conta nova → deve ir parar a `/mfa/setup` → digitalizar QR com uma app TOTP → confirmar código → deve entrar em `/perfil`. Depois: logout → login → deve pedir `/mfa/verify` (já não `/mfa/setup`). Tentar aceder a `/perfil` diretamente sem sessão → deve mandar para `/login`.
4. Confirmar que as restantes áreas (marketplace, fórum, imóveis, etc.) continuam acessíveis normalmente depois de autenticado com AAL2 — o gate aplica-se a todas as rotas exceto as públicas listadas acima.

### Por decidir / não feito nesta fase

- Não mexi nas tabelas `two_factor_enabled`/`recovery_codes`/`user_sessions` (ficam por agora).
- Não mudei o nome de `NEXT_PUBLIC_SUPABASE_ANON_KEY` — mantive a convenção atual do projeto.
- **FASE 7 em diante** (tabelas `follows`, `groups`, `group_members`, feed genérico `comments`/`reactions`, mensagens genéricas, `post_media`, Storage, Realtime, páginas do feed) — ainda não começada. Fica para a próxima iteração, confirmando primeiro que esta base de segurança funciona.

---

## 11. CHECKPOINT — 2026-08-24 (fim do dia) — RETOMAR AQUI AMANHÃ

**Estado: FASES 3–6 escritas e verificadas por type-check isolado, mas o teste real no browser ainda NÃO confirma que funcionam.** Não avançar para a FASE 7 antes de resolver isto.

### O que o utilizador reportou

- Confirmou que os ficheiros estão no disco (eu próprio verifiquei via `device_stage_files`, mtimes batem certo com a escrita de hoje).
- Testou em `http://localhost:3000/registo`: preencheu username + password mas inicialmente deixou o campo **Email vazio** (mostrei isso no screenshot que ele enviou).
- Depois de eu apontar isso, pedi para preencher o email e clicar "Criar conta".
- Resposta do utilizador: **"está como estava"** — ou seja, o registo continua a comportar-se como antes das minhas alterações (presumivelmente vai direto para `/perfil`, sem passar por `/mfa/setup`). Não recebi confirmação se isto foi depois de:
  - fazer `Ctrl+C` no `npm run dev` e voltar a arrancar;
  - apagar a pasta `.next` (`rm -rf .next`);
  - testar numa janela anónima/privada do browser.
  Ou seja, **não sabemos ainda se o teste "está como estava" já foi feito com a cache limpa, ou se ainda está a servir a build antiga.**
- Também não temos confirmação de que o TOTP foi ativado no Dashboard do Supabase (passo manual 1 do checkpoint anterior).

### Hipóteses a verificar amanhã, por ordem

1. **Cache/servidor não reiniciado de facto.** `proxy.ts`/middleware só é lido no arranque do servidor Next.js — se o `npm run dev` antigo continuou a correr, ou se o `.next` não foi mesmo apagado, a app pode estar a servir o código anterior. **Primeiro passo amanhã: confirmar explicitamente que o utilizador fez `Ctrl+C`, `rm -rf .next`, `npm run dev` de novo, E testou numa aba anónima.**
2. **Erro silencioso no `signUp` ou no redirect** — pedir para abrir a consola do browser (F12 → separador "Console") e o separador "Network" ANTES de clicar em "Criar conta", repetir o registo, e mandar screenshot/copiar qualquer erro vermelho que apareça ali. Também verificar o terminal onde corre `npm run dev` por erros.
3. **TOTP ainda não ativado no Supabase Dashboard hosted** — isto não devia impedir o redirect para `/mfa/setup` em si (o redirect no `register-form.tsx` não depende de MFA estar ativado, só de existir sessão), mas pode causar um erro dentro da página `/mfa/setup` ao chamar `mfa.enroll()`, que por sua vez pode levar a alguma navegação inesperada. Confirmar que este passo foi mesmo feito.
4. **Conta de teste anterior já existia sem email** — se a primeira tentativa (com email vazio) tiver de facto criado uma conta parcial ou entrado em algum estado de sessão residual, isso pode estar a confundir os testes seguintes. Sugerir usar sempre um email novo a cada teste, e confirmar no Supabase Dashboard (Authentication → Users) quantas contas de teste já foram criadas.

### Plano para amanhã

1. Pedir ao utilizador, por esta ordem, com confirmação escrita de cada passo:
   - Parar o `npm run dev` (Ctrl+C).
   - `rm -rf .next` dentro de `~/Nextcloud/Projectos/otiodojoca`.
   - Confirmar no Supabase Dashboard que TOTP está ativado (Authentication → Providers → MFA).
   - `npm run dev` de novo, esperar o "Ready".
   - Abrir uma janela anónima, abrir a consola (F12) ANTES de testar.
   - Ir a `/registo`, preencher tudo incluindo um email novo, submeter.
   - Mandar screenshot do que aparece + qualquer erro na consola/terminal.
2. Só depois de ver isso, diagnosticar o problema real (pode ser tão simples como cache, ou pode ser um bug genuíno no código que escrevi — não descartar isso).
3. Só depois de o fluxo MFA funcionar de ponta a ponta é que avançamos para a FASE 7 (tabelas `follows`, `groups`, feed, mensagens, Storage, Realtime).

**Não foi feita nenhuma alteração a código desde o checkpoint da Fase 3–6.** Os ficheiros no computador do utilizador são os mesmos listados na secção 10.

---

## 12. CHECKPOINT 2 — causa provável encontrada

Ao voltar a inspecionar o projeto, encontrei fortes indícios de que alguém (o Yos, possivelmente com ajuda do Claude Code local — existe uma pasta `.claude` no projeto) já andou a mexer em `.env.local` esta noite: apareceram ficheiros novos `.env.local.save.1`, `Environment`, `test-supabase.js` (vazios/de backup), e o `.env.local` atual tem timestamp mais recente que tudo o resto.

**Achado principal:** o `.env.local` real do projeto usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o nome novo da chave pública do Supabase), mas os ficheiros `lib/supabase/client.ts`, `server.ts` e `middleware.ts` — tanto os originais como os que eu escrevi nas Fases 3–6 — estavam à procura de `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nome antigo), que já não existe no ficheiro. Isto faz o cliente Supabase falhar silenciosamente (chave `undefined`).

**Ao ir corrigir isto, descobri que os três ficheiros no computador do utilizador JÁ tinham sido corrigidos** (mtime mais recente que a minha última escrita, conteúdo já usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) — ou seja, alguém já resolveu esta parte antes de eu voltar a olhar. Não fiz nenhuma escrita nova nestes 3 ficheiros (já estavam corretos).

O único ficheiro que ainda não bate certo é `.env.local.example` (a documentação/template, não usado em runtime) — mas o sistema bloqueia escrita remota a ficheiros `.env*` por segurança, por isso este ficheiro tem de ser corrigido manualmente pelo Yos (baixa prioridade, é só um exemplo).

**Também reparei nisto, por confirmar:** dentro de `.env.local`, a linha `SUPABASE_SERVICE_ROLE_KEY=sb_publishable_[REDIGIDO]` começa por `sb_publishable_`, que é o prefixo da chave PÚBLICA, não da chave secreta (que deveria começar por `sb_secret_`, como se via numa versão anterior guardada em `.env.local.save.1`: `sb_secret_[REDIGIDO — valor real removido em 09/09/2026 por ter sido apanhado pelo GitHub Push Protection; chave entretanto rodada no Dashboard]`). Isto não bloqueia o MFA (login/registo normal não usa esta chave), mas pode fazer falhar rotas administrativas que dependem de bypassar RLS (`lib/supabase/admin.ts`, usado por `app/api/seed/route.ts`). Pedir ao Yos para confirmar/corrigir esta linha no Dashboard do Supabase (Project Settings → API Keys → copiar a "secret key", não a "publishable key").

### Próximo passo recomendado

Como o código e o `.env.local` já estão consistentes agora (ambos usam `PUBLISHABLE_KEY`), o mais provável é que o servidor `npm run dev` que está a correr ainda tenha as variáveis de ambiente antigas carregadas em memória — o Next.js só lê o `.env.local` quando o processo arranca. Pedir ao Yos: parar o servidor (Ctrl+C), `rm -rf .next`, `npm run dev` de novo, testar em aba anónima. Se mesmo assim continuar "como estava", pedir print da consola do browser (F12) e do terminal.

---

## 13. CHECKPOINT 3 — 2026-08-25 — chave publishable corrompida, bug do QR, MFA a funcionar

### Causa real do 401 em `/auth/v1/signup`

Não era só cache: o valor de `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em `.env.local` estava corrompido/incompleto (`sb_publishable_I9w3cjnPuJJIWmyCbXQw_6nPs1`, faltavam/estavam trocados caracteres). O Yos confirmou o valor correto no Dashboard (`sb_publishable_jwsI9cjnPuJJIWmyCbX0qw_6nPs1qIz`) e corrigiu via terminal (`sed` + `rm -rf .next` + `npm run dev`). Confirmado por screenshot: os 401 desapareceram, o registo passou a chegar mesmo ao servidor Supabase.

**Ainda por corrigir (baixa prioridade, não bloqueia nada agora):** `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` continua com o prefixo `sb_publishable_` em vez de `sb_secret_` (ver secção 12). Só afeta rotas administrativas (`lib/supabase/admin.ts`, `app/api/seed/route.ts`), não o login/registo/MFA.

### Bug do QR code — encontrado e corrigido

Depois do 401 resolvido, o `/mfa/setup` carregava mas o QR aparecia partido: em vez da imagem, via-se o texto literal `data:image/svg+xml;utf-8,...` por cima do SVG. Causa: `data.totp.qr_code` devolvido pelo `mfa.enroll()` já é uma **data URI completa** (`data:image/svg+xml;utf-8,<svg>...`), não SVG em bruto — e o código estava a injetá-la com `dangerouslySetInnerHTML`, que trata a string toda como texto/markup em vez de a interpretar como fonte de imagem.

**Fix aplicado em `components/auth/mfa-setup.tsx`:** troquei o `<div dangerouslySetInnerHTML>` por um `<img src={...}>`, com lógica defensiva que usa a string diretamente se já começar por `"data:"`, ou a envolve como data URI se vier como SVG em bruto. Verificado com `tsc --noEmit` (0 erros) e confirmado escrito no disco do utilizador via `device_commit_files` (sem rejeições).

### TOTP no Dashboard hosted — confirmado pelo utilizador

O Yos confirmou (via link direto `https://supabase.com/dashboard/project/opdvusuwrhmbgkthscsc/auth/providers`) que o TOTP (Authenticator App) parece estar ativo — "isso acho que funciona". **Nota:** ainda não temos confirmação por teste real de ponta-a-ponta (registar → digitalizar QR → confirmar código → cair em `/perfil`) — só a confirmação de que o toggle está ligado. Recomendo fazer esse teste completo antes de dar a Fase 5/6 como 100% fechada.

### Próximo tema: email de confirmação de registo (via Spacemail)

O Yos quer que o sistema envie um email de registo com link de confirmação. O fluxo já está preparado no código existente (não precisa de alterações):

- `register-form.tsx` já trata o caso de `signUp()` não devolver sessão (mostra "Verifica o teu email para confirmares a conta").
- `app/(auth)/auth/callback/route.ts` já troca o `code` do link por sessão (`exchangeCodeForSession`) e redireciona para `next` (por omissão `/perfil`).
- Como o MFA é obrigatório, o middleware intercepta esse redirect automaticamente e manda primeiro para `/mfa/setup` se o utilizador ainda não tiver fator verificado — não é preciso lógica extra.

**Fornecedor de email do Yos: Spacemail (Spaceship).** Definições SMTP confirmadas na documentação oficial do Spaceship:

- Host: `mail.spacemail.com`
- Porta: `465`
- Encriptação: SSL
- Username: endereço de email completo da caixa (ex: `registo@` ou `noreply@` do domínio do Yos)
- Password: password dessa caixa de correio

**Passos manuais pendentes (Dashboard Supabase, projeto `opdvusuwrhmbgkthscsc`):**

1. Criar/confirmar no painel Spacemail uma caixa de correio real (não só um alias) para usar como remetente, ex: `registo@` ou `noreply@` do domínio.
2. `https://supabase.com/dashboard/project/opdvusuwrhmbgkthscsc/auth/smtp` — ativar "Enable Custom SMTP", preencher Sender email (a caixa criada), Sender name (ex: "O Tio do Joca"), Host `mail.spacemail.com`, Port `465`, Username (email completo), Password.
3. `Authentication → Sign In / Providers → Email` — ativar o toggle **"Confirm email"**.
4. `Authentication → URL Configuration` — confirmar Site URL (`https://otiodojoca.vercel.app`) e adicionar aos Redirect URLs `https://otiodojoca.vercel.app/**` e `http://localhost:3000/**`.
5. Testar: registar utilizador novo → confirmar que chega o email → clicar no link → confirmar que cai em `/mfa/setup` (não direto em `/perfil`, porque ainda não tem MFA configurado).

**Ainda não feito nesta fase:** nenhuma destas configurações de SMTP/confirmação de email foi aplicada — são passos que só o Yos consegue fazer no Dashboard/painel Spacemail. Não avançar para a Fase 7 antes de (a) confirmar o teste MFA de ponta-a-ponta e (b) decidir se o email de confirmação é bloqueador ou fica para depois.

---

## 14. CHECKPOINT 4 — 2026-08-25 — RETOMAR AQUI

### Bug do enroll (422) — CORRIGIDO e confirmado a funcionar

Causa real: a conta de teste `neves@superloja.com` tinha **2 fatores TOTP "unverified"** acumulados de testes anteriores. O código só limpava o primeiro que encontrava (`.find()`), deixando o outro a bloquear qualquer `enroll()` novo com 422.

Fix aplicado em `components/auth/mfa-setup.tsx`: passou a listar e apagar **todos** os fatores TOTP pendentes (`.filter()` + `Promise.all` de `unenroll`, com `.catch()` a ignorar 404 de fatores já expirados/inexistentes) antes de tentar criar um novo. Verificado com `tsc --noEmit` (0 erros), enviado e gravado no computador do Yos (`device_commit_files` confirmado, sem rejeições).

**Confirmado a funcionar no browser real** (screenshot do separador Rede): `DELETE` aos 2 fatores antigos + `POST factors` com sucesso (200), QR code a aparecer corretamente.

**Nota (não é bug, é comportamento normal):** em `npm run dev`, o StrictMode do React corre os efeitos duas vezes, o que pode criar um fator TOTP "órfão" extra a cada carregamento da página `/mfa/setup`. Como o fix limpa sempre todos os pendentes no carregamento seguinte, isto autolimpa-se sozinho e não bloqueia nada. Não acontece em `npm run build` (produção).

**Por confirmar ainda:** o Yos não chegou a completar o teste até ao fim — digitalizar o QR, introduzir o código de 6 dígitos, clicar "Confirmar e ativar", e verificar que cai em `/perfil`. Interrompeu para focar no email de confirmação.

### Email de confirmação de registo (Spacemail) — em configuração, não testado

Estado confirmado por screenshot do Dashboard (`Authentication → Emails → SMTP Settings`):
- "Enable Custom SMTP": **ON**
- Sender email: `neves@superloja.com`
- Sender name: `otj`
- Host: `mail.spacemail.com`
- Port: `465`
- Minimum interval per user: `60` segundos
- Username: `neves@superloja.com`
- Password: não visível no screenshot (campo ficou fora do enquadramento) — **por confirmar se foi preenchida**, e se o Yos clicou em "Save"/"Guardar".

**Ainda por confirmar/fazer:**
1. Password no SMTP preenchida + botão Save/Guardar clicado.
2. Toggle **"Confirm email"** ativado em `Authentication → Sign In / Providers → Email` (página diferente da do SMTP — ainda não confirmado que o Yos foi lá).
3. `Authentication → URL Configuration`: Site URL (`https://otiodojoca.vercel.app`) e Redirect URLs (`https://otiodojoca.vercel.app/**`, `http://localhost:3000/**`) — ainda não confirmado.

### Plano para a próxima sessão, por esta ordem

1. Confirmar os 3 pontos pendentes do SMTP/Confirm email acima.
2. Testar registo com um **email genuinamente novo** (nunca usado nos testes anteriores — `neves@superloja.com` já está confirmado, não serve para este teste) em `/registo`. Deve mostrar "Verifica o teu email", **não** ir direto para `/mfa/setup`.
3. Confirmar que o email chega (enviado por `neves@superloja.com` via Spacemail), clicar no link, confirmar que cai em `/mfa/setup` (via `/auth/callback`).
4. Completar o teste do MFA que ficou a meio: digitalizar QR, introduzir código de 6 dígitos, confirmar redirect para `/perfil`.
5. Logout → login com a mesma conta → deve pedir só `/mfa/verify` (não `/mfa/setup` outra vez).
6. Tentar aceder a `/perfil` sem sessão (aba anónima nova) → deve mandar para `/login`.
7. Só depois de 2–6 confirmados de ponta a ponta é que avançamos para a **FASE 7** (tabelas `follows`, `groups`, `group_members`, `comments`/`reactions` genéricos, `conversations`/`messages` genéricos, `post_media`, Storage, Realtime, páginas do feed).

### Por decidir/corrigir, baixa prioridade (não bloqueia o acima)

- `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` continua com prefixo `sb_publishable_` em vez de `sb_secret_` (secção 12) — só afeta rotas administrativas (`lib/supabase/admin.ts`, `app/api/seed/route.ts`), o Yos precisa de corrigir manualmente via Dashboard → Project Settings → API Keys.
- `.env.local.example` continua com o nome antigo `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cosmético, bloqueado de escrita remota).

---

