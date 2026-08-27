# OTJ — Fase 6.1 — Auditoria Backend / API

**Data:** 2026-08-23 22:08 (Europe/Lisbon)
**Repositório:** `/home/berze/Nextcloud2/Projectos/otiodojoca`
**Executado por:** Claude (Cowork), sessão cloud — via device bridge (sem `device_bash` disponível neste dispositivo; auditoria feita por leitura directa de ficheiros staged a partir do repositório real).
**Cópia irmã:** `~/Transferências/OTJ-FASE-6-01-AUDITORIA-BACKEND-API-20260823-220827.txt`

---

## Protocolo EVOLUI/REPETIR

**EVOLUI.** Não existia, no repositório, um mapa consolidado de endpoints/server actions/RLS para o backend actual — apenas auditorias pontuais antigas (`AUDITORIA-RESERVAS*.txt`, `AUDITORIA-COMER*.txt`, `AUDITORIA-RLS-RESERVAS.txt`, datadas de antes de 2026-08-12) que já não reflectem o código actual (o problema que descreviam em `lib/comer/actions.ts` — sem autenticação, sem validação de data — já está corrigido no ficheiro actual). Este documento consolida o estado real a partir do código lido agora, não do inventário antigo.

**Nota sobre o prompt original:** o prompt mestre fornecido referia caminhos Windows (`C:\Users\sev7\...`). A máquina ligada a esta sessão é Linux Mint (`berze-optiplex-5050`). O utilizador confirmou usar esta máquina; o repositório real foi localizado em `/home/berze/Nextcloud2/Projectos/otiodojoca` (existe um duplicado idêntico em `/home/berze/Nextcloud/Projectos/`, não auditado nesta fase; e um backup em `otiodojoca.backup-atual`, também não auditado — ambos **NÃO VERIFICADOS**).

**Limitação técnica desta execução:** este dispositivo não expõe um shell remoto (`device_bash`) a esta sessão — só listagem de directórios e transferência de ficheiros individuais. Não foi possível correr grep/ripgrep sobre a árvore completa. A auditoria cobre os ficheiros de backend identificados por inspecção estrutural (`app/api`, `app/**/actions.ts`, `lib/**/actions.ts`, `lib/supabase/*`, `supabase/schemas`, `supabase/migrations` recentes) — não uma pesquisa textual exaustiva. Onde a cobertura é parcial, está assinalado **NÃO VERIFICADO**.

---

## 1 — Mapa de endpoints (Route Handlers, `app/api/`)

Só existem **três** route handlers no projecto inteiro — a esmagadora maioria da lógica de escrita passa por Server Actions (ver secção 2):

### `GET /api/geocode`
- Ficheiro: `app/api/geocode/route.ts`
- Geocodifica um código postal PT: tenta cache local (`codigos_postais_geo`), depois Nominatim (OSM) com User-Agent identificável e cache de 30 dias.
- Auth: nenhuma (leitura pública, adequado).
- Validação: regex do código postal (`0000-000`). OK.

### `POST /api/seed`
- Ficheiro: `app/api/seed/route.ts`
- Insere dados de teste (localização, alojamento "Hotel Tio do Joca", refeições) usando `createAdminClient()` — cliente com **service role key**, que ignora RLS.
- Auth: **nenhuma**. Ver RISCO-01 (secção 16).
- Idempotente, mas isso não resolve o problema: qualquer pessoa na internet pode invocar `POST /api/seed` e escrever na base de dados com privilégios de admin.

### `POST /api/reservas/[id]`
- Ficheiro: `app/api/reservas/[id]/route.ts`
- Valida campos obrigatórios e chama `criarReservaAlojamento()` (`lib/alojamento/actions.ts`) — route handler fino, delega a lógica.
- Auth: nenhuma exigida (reservas de alojamento são públicas por desenho — ver RLS na secção 8).
- **NÃO VERIFICADO:** porque tem também um route handler dedicado, se `lib/alojamento/actions.ts` já é `'use server'` e podia ser chamada directamente. Não foi possível confirmar se algum componente cliente chama `fetch('/api/reservas/[id]')` em vez de invocar a action directamente (ver LACUNA-06).

Não existem mais rotas `app/api/**/route.ts` (confirmado pela listagem recursiva completa de `app/`).

---

## 2 — Mapa de Server Actions (`"use server"`)

| Ficheiro | Funções | Auth | Nota |
|---|---|---|---|
| `app/gran-bazar/favoritos/actions.ts` | `toggleFavorite` | ✅ | ownership via `user_id` |
| `app/gran-bazar/leiloes/actions.ts` | `placeBid` | ✅ | delega ao RPC `gran_bazar_place_bid` (SECURITY DEFINER + row lock) — correcto |
| `app/gran-bazar/mensagens/actions.ts` | `startConversation`, `sendMessage`, `markAsRead` | ✅ | valida módulo do anúncio, impede auto-contacto |
| `app/mercado-da-terra/actions.ts` | `createAd`, `updateAd` | ✅ | `updateAd` filtra por `author_id` |
| `app/mercado-da-terra/favoritos/actions.ts` | `toggleFavorite` | ✅ | |
| `app/mercado-da-terra/messages/actions.ts` | `startConversation`, `sendMessage`, `markAsRead` | ✅ | quase idêntico ao de gran-bazar (ver Duplicação-01) |
| `app/mercado-da-terra/_actions/favorites.ts` | `toggleFavorite` | — | **STUB**: só `console.log` + `{success:true}`. Assinatura recebe `userId` como parâmetro (seria falha grave se estivesse em uso) |
| `app/mercado-da-terra/_actions/messages.ts` | `createMessage`, `getMessages` | — | **STUB**, mesma situação |
| `lib/agenda-agricola/actions.ts` | `criarPlantacao`, `atualizarEstadoPlantacao`, `adicionarEvento`, `listarPlantacoes`, `obterPlantacao`, `adicionarNota`, `adicionarFoto` | ✅ | módulo com validação mais consistente: UUID de cultura, janela de datas, listas fechadas de estados/eventos, tudo no servidor |
| `lib/alojamento/actions.ts` | `listarAlojamentos`, `obterAlojamento`, `obterAlojamentoComRefeicoes`, `filtrarAlojamentos*`, `criarReservaAlojamento`, `listarReservasAlojamento`, `obterReserva`, `atualizarStatusReserva`, `cancelarReserva`, `verificarDisponibilidade`, `calcularPrecoReserva` | ❌ | **nenhuma** verificação de auth/ownership em toda a superfície de escrita — ver RISCO-02 |
| `lib/comer/actions.ts` | `criarReserva` | ✅ | corrigido desde a auditoria antiga; valida data no servidor com comentário explícito sobre contornar validação de cliente — bom padrão a replicar |
| `lib/freguesia/actions.ts` | `getFreguesiaByCodigo`, `getEntidadesByFreguesia`, `getEntidadeBySlug`, `getCategorias` | — | só leitura, sem auth (correcto — conteúdo público) |
| `lib/supabase/marketplace.ts` | `getAds`, `getAdById`, `createAd`, `updateAd`, `deleteAd`, `addToFavorites`, `removeFromFavorites`, `getUserFavorites`, `isFavorite`, `createConversation`, `sendMessage`, `createReview`, `reportAd`, ... | ❌ | não é `'use server'`; recebe `userId`/`authorId` como parâmetro em vez de obter da sessão; nenhuma função verifica auth nem ownership — depende inteiramente da RLS. **NÃO VERIFICADO** se ainda é importado por alguma página (ver Duplicação-03 / Lacuna-01) |

---

## 3 — Mapa de queries / clientes Supabase

- `lib/supabase/client.ts` — `createBrowserClient` (anon key). Client Components.
- `lib/supabase/server.ts` — `createServerClient` (anon key, cookies). Server Components/Actions/Route Handlers.
- `lib/supabase/middleware.ts` — `updateSession(request)`, usado por `proxy.ts` (secção 7). Só refresca a sessão — **não faz nenhum controlo de acesso**.
- `lib/supabase/admin.ts` — `createAdminClient` (**service role key**, ignora RLS). Único consumidor: `app/api/seed/route.ts`, sem verificação de quem o chama (RISCO-01).
- `lib/supabase/marketplace.ts` — usa `createClient()` de `server.ts` (anon key, respeita RLS).

Sem camada de "repository"/ORM adicional — query builder do Supabase-js directamente nos ficheiros de actions. RPCs chamados explicitamente: `gran_bazar_place_bid` (`app/gran-bazar/leiloes/actions.ts`) e `increment_views` (`lib/supabase/marketplace.ts`, estatuto de uso por confirmar).

---

## 4 — Mapa Supabase (schemas / migrations relevantes)

`supabase/schemas/public/tables/` — 60+ ficheiros (declarative schema snapshot); migrations incrementais reais em `supabase/migrations/` (12 ficheiros, 2026-08-20 a 2026-08-23).

**Domínio Almanaque/Culturas (auditado):**
- `culturas_guia` — RLS: leitura pública (`culturas_guia_read_public`, `USING true`); sem policy de escrita para authenticated/anon (só service_role/postgres) — consistente com conteúdo gerido por script (`scripts/gerar-culturas-guia-seed.mjs`).
- `plantacoes` — RLS: 5 policies, todas `auth.uid() = utilizador_id` — bem desenhado.
- `plantacao_historico` — **NÃO VERIFICADO** (não lido nesta fase).
- `calendar_events`, `calendar_categories`, `calendar_event_*`, `calendar_reminders`, `calendar_user_calendar` — 12 tabelas `calendar_*`. `calendar_events` tem RLS correcta (dono cria/edita/apaga; select público só se `visibility='public'` ou dono). Restantes **NÃO LIDAS** (ficam para o Bloco 9 — Calendário).

**Domínio Marketplace (gran-bazar / mercado-da-terra):**
- `marketplace_ads` — coluna `module` (`mercado-da-terra` | `gran-bazar`) acrescentada por migration aditiva: **reutiliza a mesma tabela** para os dois módulos em vez de duplicar. Boa decisão de modelo de dados.
- `marketplace_auctions`, `marketplace_auction_bids` — específicas do Gran Bazar, RLS bem desenhada, incluindo uma correcção documentada no próprio SQL (policy antiga permitia ao autor alterar um leilão já com lances — corrigida em 2026-08-23).

**Domínio Alojamento/Comer:**
- `alojamentos`, `refeicoes_alojamento`, `reservas_alojamento` — RLS de `reservas_alojamento` identificada como risco (secção 8/16, RISCO-02).
- `restaurantes`, `restaurante_reservas` — RLS correcta, já com FK para `restaurantes(id)`. A ausência de FK descrita em `AUDITORIA-RESERVAS-RELACOES.txt` (antes de 2026-08-12) **já não se verifica** — REPETIR, achado histórico resolvido.

**Migrations recentes lidas na íntegra:**
- `20260822200000_gran_bazar.sql` — cria `module` em `marketplace_ads`, amplia `status` check, cria `marketplace_auctions`/`auction_bids` com RLS, declara bucket de storage `marketplace-photos` com policies.
- `20260823000000_gran_bazar_leiloes_ativos.sql` — trigger SECURITY DEFINER que cria o leilão automaticamente ao publicar anúncio `type='leilao'`; corrige policy insegura anterior; função `gran_bazar_place_bid()` com `SELECT...FOR UPDATE` + idempotência via `request_id`; função `gran_bazar_advance_auctions()` (scheduled→live→ended) que **precisa de agendador externo** — não corre sozinha (ver LACUNA-02).

Não existe pasta `supabase/policies/` separada — RLS inline nos ficheiros de tabela e nas migrations. Sem fontes divergentes.

---

## 5 — Mapa de tipos

- `lib/alojamento/tipos.ts` — `Alojamento`, `AlojamentoComLocalizacao`, `AlojamentoComRefeicoes`, `RefeicaoAlojamento`, `ReservaAlojamento`, `TipoRefeicao`. Usados consistentemente.
- `lib/agenda-agricola/tipos.ts` — `EstadoPlantacao`, `TipoEvento`, `CriarPlantacaoInput`, `AtualizarPlantacaoInput`, `AdicionarEventoInput`. Validação runtime replicada manualmente no `actions.ts` (listas fechadas) — não é erro, mas é uma divergência potencial entre tipo TS e validação runtime.
- `lib/gran-bazar/ad-types.ts` vs `lib/mercado-da-terra/ad-types.ts` — dois ficheiros paralelos para o mesmo conceito. **Não comparados campo a campo** (LACUNA-03) — candidato natural a fundir, já que `marketplace_ads` já é partilhada.

---

## 6 — Mapa de validação

Padrões inconsistentes entre módulos:

- **agenda-agricola** — mais rigoroso: regex UUID, janela de datas, listas fechadas de estados/eventos, tudo no servidor.
- **comer** — validação de data explícita no servidor, com comentário a justificar (cliente pode ser contornado).
- **alojamento** (route handler) — valida presença de campos e tipo do ID, mas não valida formato de datas/email/nº de pessoas; `criarReservaAlojamento` só valida `saída > entrada`.
- **marketplace** (mercado-da-terra/gran-bazar) — validação mínima; `parseInt`/`parseFloat` sem checar `NaN` em vários pontos (ex. `updateAd` não valida `price` resultante de `parseFloat`).
- **api/geocode** — único endpoint com validação de input claramente especificada (regex).

Sem biblioteca de validação partilhada (zod/valibot/etc.) no `package.json` — tudo manual, ad-hoc, por ficheiro (LACUNA-04, transversal, não bloqueadora).

---

## 7 — Mapa de autenticação

- Auth = Supabase Auth (`@supabase/ssr`), cookies via `lib/supabase/server.ts` (servidor) / `client.ts` (browser).
- `proxy.ts` (raiz) é o middleware do Next.js 16 — convenção mudou de `middleware.ts` para `proxy.ts` nesta versão (confirmado por `AGENTS.md`, gerado automaticamente pelo `next dev`). Não existe `middleware.ts` no repositório.
- `proxy.ts` só chama `updateSession()` — **não faz redirect nem bloqueio de rotas protegidas**. Controlo de acesso é feito página-a-página, dentro de cada Server Component/Action. Escolha arquitectural válida, mas sem rede de segurança central — cada nova página tem de lembrar-se de verificar auth. **NÃO VERIFICADO** se existe checklist/teste que garanta cobertura.
- RBAC: `profiles.role` (enum `user_role`) **e** `profiles.is_admin` (boolean) coexistem no schema. **NÃO VERIFICADO** qual é efectivamente usado — nenhuma das actions lidas consulta nenhum dos dois. Candidato a esclarecer antes de desenhar RBAC editorial do Almanaque (LACUNA-07).

---

## 8 — Mapa de RLS

**Correctamente restrita a "dono" (confirmado por leitura directa do SQL):** `plantacoes`, `calendar_events`, `marketplace_ads` (mista: select público para activos + `for all` do autor), `marketplace_auctions` (corrigida em 2026-08-23), `marketplace_auction_bids`, `profiles` (com grants a nível de coluna), `restaurante_reservas`.

**Demasiado permissiva — `reservas_alojamento` (RISCO-02):**
- `"Reservas - SELECT públicas"`: `USING (true)` — qualquer pessoa (com ou sem sessão) lista **todas** as reservas de **todos** os hóspedes, incluindo nome, email e telefone, sem mascaramento.
- `"Reservas - UPDATE próprias"`: `USING (true) WITH CHECK (true)` — o nome diz "próprias" mas a condição é literalmente `true`: qualquer pessoa pode alterar qualquer reserva de qualquer alojamento.
- Consistente com o código: nem `criarReservaAlojamento` nem `atualizarStatusReserva` nem `cancelarReserva` verificam ownership — dependiam inteiramente da RLS, que não o faz.

`culturas_guia` — só select público; escrita só via service_role, consistente com conteúdo de referência.

**NÃO VERIFICADO** (fora do conjunto lido nesta fase): `freguesias`, `entidades`, `categorias_entidade`, `horarios*`, `eventos`, fórum (`posts`/`threads`), `username_history`, `notifications`, `audit_log`, `codigos_postais*`. Recomenda-se confirmar RLS de `eventos` e `entidades` antes do Bloco 9 (Calendário), dada a relação directa com o domínio Almanaque/Freguesia.

---

## 9 — Mapa de pesquisa

Existe `app/forum/pesquisa/page.tsx` — **não lido** nesta fase (é Frontend/Bloco 7). Não foi encontrado nenhum endpoint de pesquisa dedicado nem função de pesquisa global em `lib/`. Se o Almanaque precisar de pesquisa (datas, volumes, culturas, efemérides — prompt mestre V3, secções 20/30), **não existe ainda infra-estrutura reutilizável identificada**. **NÃO VERIFICADO** — requer inspecção de `app/forum/pesquisa/page.tsx` e de possíveis extensões Postgres (`pg_trgm`, `tsvector`) nas migrations.

---

## 10 — Duplicações identificadas

**Duplicação-01 (confirmada, código) — Gran Bazar vs Mercado da Terra:**
`app/gran-bazar/mensagens/actions.ts` é cópia quase literal de `app/mercado-da-terra/messages/actions.ts` — o próprio código documenta isto no comentário de topo ("Equivalente ao... Só existe como ficheiro à parte porque..."). Mesmo padrão em `favoritos/actions.ts`. Ao nível de componentes: `components/mercado-da-terra/` e `components/gran-bazar/` têm pares equivalentes (`ad-card`/`bazar-ad-card`, `ad-form`/`bazar-ad-form`, `contact-seller-form`, `favorite-button`, `message-form` nos dois).

A **camada de base de dados já está unificada** (`marketplace_ads.module` distingue os módulos, mesma tabela) — a duplicação está só no código Next.js. Classificação: 🔵 **FUNDIR** (extrair `lib/marketplace/actions.ts` parametrizada por `module`, e componentes partilhados). **Nota de âmbito:** Mercado da Terra está fora do âmbito da integração do Almanaque — achado registado para decisão futura do dono do projecto, não bloqueia o trabalho do Almanaque.

**Duplicação-02 (confirmada, código morto) — stubs órfãos:**
`app/mercado-da-terra/_actions/{favorites,messages}.ts` têm funções com o mesmo nome (`toggleFavorite`, `createMessage`) já implementadas a sério noutro ficheiro. Os stubs só fazem `console.log`. **NÃO VERIFICADO** se algum componente ainda os importa. Classificação: 🟠 **DESACOPLAR** — confirmar ausência de imports, depois 🔴 remover.

**Duplicação-03 (parcial, não verificada por completo):**
`lib/supabase/marketplace.ts` duplica conceptualmente `createAd`/`updateAd`/`toggleFavorite`/`sendMessage` já existentes (com auth) nas actions reais — mas sem auth e com assinatura diferente. **NÃO VERIFICADO** se ainda tem importadores (LACUNA-01).

**Duplicação-04 (histórica, já resolvida) — REPETIR:**
`AUDITORIA-RESERVAS-RELACOES.txt` descrevia ausência de FK entre `restaurante_reservas.restaurante_id` e `restaurantes.id` — já existe no schema actual. Achado antigo, sem acção necessária.

---

## 11 — Componentes consumidores (mapeamento parcial)

- `components/mercado-da-terra/` (13 `.tsx`) — inclui **duas/três versões coexistentes** do mesmo componente: `ad-card.tsx` **e** `ad-card-improved.tsx`; `new-ad-form.tsx` **e** `new-ad-form-improved.tsx` **e** `novo-anuncio-form.tsx`. **NÃO VERIFICADO** qual(is) estão em uso — impacto directo em que actions cada versão consome. Fica para o Bloco 7.
- `components/gran-bazar/` (9 `.tsx`) — sem esta duplicação interna; mais recente e consistente.
- `components/almanaque/`, `components/calendario/`, `components/agenda-agricola/`, `components/alojamento/`, `components/comer/`, `components/entidades/`, `components/auth/`, `components/forum/`, `components/profile/`, `components/ui/` — listados, **não inspeccionados** (fora do âmbito Backend/API; Blocos 7/8/9).

---

## 12 — Dependências relevantes

- **Next.js ^16.3.1** — versão recente, com a mudança middleware→proxy já reflectida no código.
- **@supabase/ssr ^0.12.3, @supabase/supabase-js ^2.44.0** — únicas dependências de acesso a dados; sem ORM adicional (consistente com o prompt mestre: reutilizar Supabase directamente).
- Sem biblioteca de validação (zod/yup/valibot) — LACUNA-04.
- Sem biblioteca de testes no `devDependencies` (sem vitest/jest/playwright) — LACUNA-05.
- `supabase` (CLI) `^2.115.0` em devDependencies — confirma fluxo `supabase db diff/push`. Ficheiro solto na raiz `"upabase db push --dry-run"` (nome com erro de digitação, provavelmente output colado por engano como nome de ficheiro, 14KB, não lido) — candidato a limpeza, não a integração.

---

## 13 — Lacunas

- **LACUNA-01** — Sem `device_bash` disponível, não foi possível fazer grep sobre `app/` e `components/` para confirmar importadores de `lib/supabase/marketplace.ts`, dos stubs `_actions/`, e das versões duplicadas de componentes. Comandos a correr na próxima sessão com shell:
  ```
  grep -rn "from '@/lib/supabase/marketplace'" app/ components/
  grep -rn "_actions/favorites\|_actions/messages" app/ components/
  grep -rn "ad-card-improved\|new-ad-form-improved\|novo-anuncio-form" app/
  ```
- **LACUNA-02** — `gran_bazar_advance_auctions()` precisa de agendador externo (pg_cron ou rota+cron); nenhuma configuração encontrada nas migrations lidas. **NÃO VERIFICADO** se já está resolvido fora do repositório.
- **LACUNA-03** — `lib/gran-bazar/ad-types.ts` vs `lib/mercado-da-terra/ad-types.ts` não comparados campo a campo.
- **LACUNA-04** — Sem biblioteca de validação partilhada; validação inconsistente entre módulos.
- **LACUNA-05** — Sem testes automatizados configurados (relevante para o Bloco 12).
- **LACUNA-06** — `app/api/reservas/[id]/route.ts` existe em paralelo a `lib/alojamento/actions.ts` (já `'use server'`) sem se perceber porquê sem inspeccionar o formulário cliente.
- **LACUNA-07** — RBAC: `profiles.role` vs `profiles.is_admin`, nenhum uso confirmado no código lido.
- **LACUNA-08 — ✅ VERIFICADO em 2026-08-26, e ⚠️ risco encontrado.** `/home/berze/Nextcloud/Projectos/otiodojoca` (fora de Nextcloud2) **é mirror sincronizado, não árvore divergente** — confirmado ao nível do git: mesmo commit (`94c1448e...`), mesmo remoto (`github.com/jaaaneves-art/otiodojoca.git`), `.git/index` e `.git/refs/heads/main` idênticos byte a byte entre as duas pastas. Não há "fonte canónica" a decidir — são a mesma árvore de trabalho, sincronizada em tempo real entre duas contas Nextcloud diferentes ligadas no mesmo computador.

  **Risco real encontrado:** `.git/index (conflicted copy 2026-08-23 212348)` — um ficheiro de conflito do Nextcloud dentro do próprio `.git`, prova de que o cliente de sync já mexeu no índice do git em simultâneo a partir das duas contas. Mesmo mecanismo que já causou o bug do Turbopack documentado em `RELATORIO-LUP-20260823.md` (cache de build com "conflicted copy"), desta vez a afetar a base de dados interna do git — risco de corrupção do repositório, não só de ficheiros de build.

  **Pendente — combinado com o Yos (26/08):** manter só a conta Nextcloud ligada a `~/Nextcloud2` (a que esta sessão já usa), remover a outra conta do cliente Nextcloud desktop (sem apagar os ficheiros locais logo — só depois de confirmar que tudo continua bem a partir de `Nextcloud2`), e excluir `.git/`, `node_modules/`, `.next/`, `.vercel/` da sincronização da conta que ficar. **Adiado pelo Yos para o dia seguinte** — ainda por fazer.

  **Atualização — 2026-08-27, risco alargado:** confirmado pelo Yos um **terceiro dispositivo** a sincronizar a mesma árvore — um portátil Windows (Dell Latitude E6410 ATG, utilizador "filipe"), com o repositório em `C:\Users\filipe\Nextcloud3\Projectos\otiodojoca` (conta "Nextcloud3", nome próprio, diferente das duas contas Linux). Confirmado do Yos: **é dele próprio**, não outra pessoa. Isto não é mais duas contas na mesma máquina — é pelo menos três pontos de sincronização em tempo real (2 contas no OptiPlex Linux + 1 conta no portátil Windows) sobre o mesmo `.git`, o que **alarga o risco já documentado acima**, não o substitui.

  Também nesta sessão: a ligação desta sessão Cowork à pasta `~/Nextcloud2/Projectos/otiodojoca` no OptiPlex ficou temporariamente inacessível ("Could not stat" na pasta inteira, não só num ficheiro) durante uns minutos, coincidindo com o Yos a mexer no portátil Windows. Recuperou sozinha pouco depois — sem confirmação de causa (pode ter sido só uma sincronização a decorrer, não necessariamente ligado ao risco do `.git`), mas o timing é sugestivo o suficiente para registar.

  **Plano de remediação atualizado:** a exclusão de `.git/`, `node_modules/`, `.next/`, `.vercel/` da sincronização precisa de ser aplicada em **todos** os dispositivos que sincronizam este repositório (OptiPlex/Nextcloud2 e o portátil/Nextcloud3), não só remover a conta duplicada no OptiPlex. Continua por fazer — o Yos ainda não confirmou ter executado nenhuma parte deste plano.

---

## 14 — Classificação

**🟢 MANTER**
- `lib/supabase/{client,server,middleware,admin}.ts` — camada de acesso já reutilizável pelo Almanaque sem alteração.
- `lib/agenda-agricola/actions.ts`, `lib/comer/actions.ts` — padrão de validação/ownership a replicar.
- `app/gran-bazar/leiloes/actions.ts` + migrations associadas — motor de leilões correcto.
- `marketplace_ads.module` — padrão de reutilização de tabela a copiar se o Almanaque precisar de distinguir "tipos" sem criar tabelas novas.

**🟡 ADAPTAR**
- `lib/alojamento/actions.ts` (`atualizarStatusReserva`, `cancelarReserva`, `criarReservaAlojamento`) — acrescentar verificação de posse/token.
- RLS de `reservas_alojamento` — reescrever para condição real (decisão de produto: como identificar "o hóspede dono" sem login).

**🔵 FUNDIR**
- `app/gran-bazar/{favoritos,mensagens}/actions.ts` com os equivalentes de `mercado-da-terra` → `lib/marketplace/actions.ts` parametrizada por `module`.
- `components/gran-bazar/*` com `components/mercado-da-terra/*`.
- `lib/gran-bazar/ad-types.ts` com `lib/mercado-da-terra/ad-types.ts` (após LACUNA-03).

**🟠 DESACOPLAR / CONFIRMAR ANTES DE DECIDIR**
- `app/mercado-da-terra/_actions/{favorites,messages}.ts` (stubs).
- `lib/supabase/marketplace.ts` (confirmar importadores).
- `app/api/reservas/[id]/route.ts` (confirmar redundância com Server Action directa).

**🔴 RISCO DE SEGURANÇA — AGIR ANTES DE MAIS INTEGRAÇÃO**
- `app/api/seed/route.ts` (RISCO-01).
- RLS de `reservas_alojamento` (RISCO-02).

**⚪ IGNORAR (fora do âmbito desta fase)**
- `components/almanaque`, `components/calendario`, `components/agenda-agricola` (frontend), tabelas `calendar_*` além de `calendar_events`, `app/forum/pesquisa` — Blocos 7, 8, 9.
- Mercado da Terra como domínio de negócio — fora do âmbito da integração do Almanaque; achados de duplicação registados mas não accionáveis nesta integração.

---

## 15 — Proposta de implementação

Pela regra do prompt mestre ("NÃO IMPLEMENTES AINDA"), esta secção é **proposta**, sujeita a aprovação:

**P1 — segurança, urgente, independente do Almanaque**
- Proteger `app/api/seed/route.ts`: remover em produção, exigir header/segredo partilhado, ou restringir a `NODE_ENV=development`.
- Corrigir RLS de `reservas_alojamento` (decisão de produto primeiro: email+token, ou exigir login).

**P2 — limpeza, baixo risco**
- Confirmar e remover stubs `_actions/{favorites,messages}.ts`.
- Resolver versões múltiplas de componentes do Mercado da Terra — Bloco 7.

**P3 — preparação para o Almanaque (depois de P1)**
- Decidir, com base na secção 9 e no Bloco 9 (ainda por auditar), se o Almanaque precisa de endpoint dedicado ou basta Server Actions + Server Components (padrão dominante já usado — recomendação por defeito: seguir o mesmo padrão, não criar API REST paralela).
- Reutilizar `lib/supabase/{server,client}.ts` tal como estão.
- Não criar Almanaque Auth/RBAC — usar `profiles` + esclarecer primeiro `role` vs `is_admin` (LACUNA-07) antes de desenhar permissões editoriais.

---

## 16 — Riscos

| # | Severidade | Descrição |
|---|---|---|
| RISCO-01 | **Alto** | `app/api/seed/route.ts` — POST público, sem auth, escreve via service role key (bypassa RLS). Qualquer pessoa com a URL pode invocá-lo. |
| RISCO-02 | **Alto** | RLS de `reservas_alojamento` permite a qualquer pessoa ler PII de todos os hóspedes e alterar qualquer reserva (`USING true` / `WITH CHECK true`), confirmado por leitura directa do SQL e ausência de verificação no código. |
| RISCO-03 | Médio (condicional) | Se `lib/supabase/marketplace.ts` ainda estiver em uso, várias funções aceitam `userId`/`authorId` sem confirmar a sessão — dependem inteiramente da RLS, não totalmente auditada (`marketplace_reviews`, `marketplace_reports` não lidas). Estado: **NÃO VERIFICADO** se em uso. |
| RISCO-04 | Baixo | `gran_bazar_advance_auctions()` sem agendador confirmado — leilões podem nunca fechar. |
| RISCO-05 | Baixo, informativo | Ausência de validação/testes automatizados aumenta risco de regressões silenciosas à medida que o Almanaque for integrado — recomenda-se testes de regressão nas Server Actions de escrita antes do Bloco 12. |

---

## Próximo passo sugerido

Validar RISCO-01 e RISCO-02 com o dono do projecto (decisões de produto, não só técnicas) antes de avançar para 6.2 (mapa definitivo de endpoints) — que, na prática, já está coberto pela secção 1, dado que só existem 3 route handlers no projecto inteiro. Recomenda-se avançar directamente para 6.5/6.6 (Integração Supabase / Segurança-RLS, já em grande parte cobertas aqui) e 6.3 (Server Actions, secção 2) — confirmando primeiro as Lacunas 01, 03, 06 e 07 antes de fechar o Gate do Bloco 6.

---

## 17 — Atualização — 2026-08-26 — RISCO-01 e RISCO-02 RESOLVIDOS

**RISCO-01 (`app/api/seed/route.ts` sem auth, service role key exposta).** ✅ Corrigido no código: a rota devolve 404 fora de `NODE_ENV=development`. Confirmado por leitura directa do ficheiro (sessão Cowork, via device bridge). **Por confirmar:** que esta correção está commitada, `git push`ada e já em produção (Vercel) — não verificado nesta sessão, só o ficheiro local.

**RISCO-02 (RLS aberta em `reservas_alojamento`).** ✅ Resolvido de ponta a ponta:
- Migration `supabase/migrations/20260826120000_fix_reservas_alojamento_rls.sql` escrita: acrescenta `user_id` (FK para `auth.users`), substitui as três policies `USING(true)`/`WITH CHECK(true)` por policies que exigem `auth.uid() = user_id` (ou `profiles.role in ('moderator','admin')` para staff), revoga grants de `anon`.
- `lib/alojamento/actions.ts` → `criarReservaAlojamento()` já actualizada em consonância: exige sessão (`supabase.auth.getUser()`), grava `user_id: user.id` no insert. Confirmado por leitura directa — consistente com a nova RLS, sem alterações necessárias.
- Migration aplicada ao remoto com sucesso via `npx supabase db push` (confirmado: `20260826120000` aparece em Local e Remote em `supabase migration list`).
- **Nota conhecida, aceite deliberadamente** (ver comentário na própria migration): sem excepção `OR user_id IS NULL`, pelo que reservas criadas antes desta migration ficam com `user_id` vazio e só staff (`moderator`/`admin`) consegue vê-las/geri-las — quem as fez perde o acesso a essas reservas antigas específicas. Novas reservas não são afectadas.
- **Ainda por verificar** (fora do alcance desta sessão, sem terminal no projecto real): testar ao vivo o fluxo de criar uma reserva autenticado, e confirmar que `profiles.role` (não `profiles.is_admin` — ver LACUNA-07 acima) é de facto o campo usado para marcar staff nesta base de código.

`atualizarStatusReserva`/`cancelarReserva` continuam sem verificação de ownership no código (ver classificação 🟡 ADAPTAR, secção 14) — mas ficam agora protegidas pela RLS nova como rede de segurança (um update fora do próprio user_id/staff simplesmente não afecta nenhuma linha). Adaptar o código para dar um erro explícito em vez de depender só da RLS continua a ser uma melhoria de UX pendente, não um risco de segurança.

**LACUNA-01 / Duplicação-03 / RISCO-03 — praticamente fechada.** Sem `grep` de árvore completa (continua sem `device_bash` nesta sessão), mas confirmado por leitura directa de todos os `page.tsx`/`actions.ts` dos cinco módulos de anúncios (`gran-bazar`, `mercado-da-terra`, `lup`, `viaturas`, `imoveis`), da home (`app/page.tsx`) e dos componentes de imagem do Mercado da Terra (`image-upload.tsx`, `image-cropper.tsx`): **nenhum importa `lib/supabase/marketplace.ts`**. Todos os módulos usam o padrão real (`@/lib/supabase/server` + Server Actions próprias por módulo), nunca este ficheiro. RISCO-03 (funções sem verificação de sessão, dependem só da RLS) fica portanto **sem impacto conhecido** — o ficheiro parece ser código morto. Não confirmado 100% (não foram lidos todos os ficheiros de `components/mercado-da-terra/`, nem pesquisado fora dos cinco módulos de marketplace), mas a cobertura é ampla o suficiente para ser um forte candidato a remoção — um ficheiro sem auth que ninguém usa é um risco à espera de alguém o importar por engano no futuro.

---

## 18 — Atualização — 2026-08-27 — LACUNA-05: primeiros testes automatizados

**LACUNA-05 (sem testes automatizados) — parcialmente fechada.** Configurado Vitest no projeto (`vitest.config.ts` na raiz, `vitest` acrescentado a `devDependencies`, scripts `npm test`/`npm run test:watch`) e escrito o primeiro ficheiro de testes: `lib/alojamento/actions.test.ts`, cobrindo `criarReservaAlojamento()` — escolhida por ser exactamente a função que a correção de RISCO-02 (secção 17 acima) alterou, para proteger essa correção contra regressão futura.

5 testes, todos unitários (sem base de dados real — `@/lib/supabase/server` é mockado), todos a passar (confirmado pelo Yos: `npm install && npm test`, `5 passed (5)`):
- rejeita se não houver sessão iniciada;
- rejeita se a data de saída não for depois da data de entrada;
- **liga a reserva sempre ao `user_id` da sessão autenticada, nunca a um valor vindo do cliente** — este é o teste que protege especificamente a correção de RISCO-02;
- propaga o erro do Supabase (ex: RLS a bloquear o insert);
- devolve a reserva criada com sucesso.

**Por que só unitários e só este módulo, por agora:**
- Testes unitários mockam o cliente Supabase e correm em milissegundos, sem precisar de `device_bash` nem de uma base de dados de teste — o único tipo de teste viável de configurar remotamente nesta sessão (sem terminal próprio, todos os comandos foram dados ao Yos para correr).
- Testes end-to-end (Playwright, contra a UI real) ficariam para uma fase seguinte — precisam de mais configuração (browser, servidor a correr) e de iteração mais próxima do terminal.
- O motor de leilões do Gran Bazar (`gran_bazar_place_bid`/`gran_bazar_advance_auctions`) — o código mais arriscado do projecto (dinheiro + concorrência, partilhado por 3 módulos) — **não é testável com testes unitários puros**: é lógica em PL/pgSQL, não TypeScript. Precisa de testes de integração contra uma base de dados de teste (pgTAP, ou Supabase local + chamadas RPC reais) — candidato natural para a próxima ronda, mas mais trabalho de configuração.

**Continua em aberto:**
- `calcularPrecoReserva` (mesmo módulo, lógica de preço com refeições) — bom próximo candidato a testes unitários, mesma abordagem.
- Motor de leilões (Gran Bazar/Viaturas/Imóveis) — precisa de testes de integração, não unitários.
- Testes end-to-end dos fluxos críticos (reserva, leilão, aprovação de Entidade Parceira) — nenhum escrito ainda.
- LACUNA-05 fica **parcialmente** fechada, não resolvida — 1 função de 1 módulo tem cobertura, o resto do projecto continua sem rede de segurança automatizada.

---

## 19 — Atualização — 2026-08-27 — Duplicação-01: actions.ts de mensagens/favoritos fundidas

**Duplicação-01 (secção 10) — parcialmente fechada.** A pedido do Yos, revisitada a decisão que tinha ficado em standby ("deixar para depois"). Antes de mexer em código, foi mostrado o diff real entre os pares de ficheiros para decidir o âmbito com informação completa.

**O que o diff revelou:**
- `favoritos/actions.ts` (Gran Bazar vs Mercado da Terra): **zero diferença de lógica** — só os caminhos hardcoded no `revalidatePath` mudavam. Fusão sem risco nenhum.
- `mensagens/actions.ts` (Gran Bazar) vs `messages/actions.ts` (Mercado da Terra): sobretudo formatação e caminhos hardcoded, mas com **uma diferença real de comportamento**: a versão do Gran Bazar validava `ad.module !== "gran-bazar"` antes de abrir conversa; a do Mercado da Terra não validava o módulo do anúncio nenhum — dava para iniciar conversa a partir de um `adId` de qualquer outro módulo (Gran Bazar, Lup, Viaturas, Imóveis). Não é um risco de segurança grave (RLS de `marketplace_conversations` continua a aplicar-se, precisa de sessão), mas era uma lacuna real de isolamento entre módulos.

**Ação tomada — só a camada de actions.ts (âmbito reduzido, por decisão explícita):**
- `lib/marketplace/favoritos-actions.ts` (novo) — `toggleFavoritoAction(module, formData)`, parametrizada.
- `lib/marketplace/mensagens-actions.ts` (novo) — `startConversationAction`/`sendMessageAction`/`markAsReadAction`, parametrizadas por `module` + `routeSegment` (routeSegment porque as rotas têm nomes diferentes: "mensagens" no Gran Bazar, "messages" no Mercado da Terra). A validação `ad.module !== module` foi generalizada — **corrige a lacuna do Mercado da Terra de graça**, como parte da fusão.
- `app/gran-bazar/favoritos/actions.ts`, `app/mercado-da-terra/favoritos/actions.ts`, `app/gran-bazar/mensagens/actions.ts`, `app/mercado-da-terra/messages/actions.ts` — reduzidos a wrappers finos, só chamam a versão partilhada com o `module`/`routeSegment` certos. **Nenhum import existente em componentes/páginas muda** — os nomes exportados (`toggleFavorite`, `startConversation`, `sendMessage`, `markAsRead`) mantêm-se, só a implementação por trás passou a ser partilhada.
- Ficheiros `lib/marketplace/*.ts` deliberadamente sem `"use server"` — nunca são chamados directamente de um componente cliente nem passados como `action` de um `<form>`, só pelos quatro wrappers acima (esses sim com `"use server"`).

**Deliberadamente fora do âmbito desta ronda:** os componentes emparelhados (`ad-card`/`bazar-ad-card`, `ad-form`/`bazar-ad-form`, `contact-seller-form`, `favorite-button`, `message-form`) — o Yos escolheu fundir só as actions.ts por agora; os componentes ficam para uma sessão à parte, precisam de mais análise por serem mais ficheiros e maior risco de regressão visual.

**`npm run build` confirmado limpo** (2026-08-27, corrido pelo Yos): `Compiled successfully`, `Finished TypeScript` sem erros, todas as rotas geradas — incluindo `/gran-bazar/mensagens`, `/gran-bazar/favoritos` e `/mercado-da-terra/messages` (as duas únicas usam agora os wrappers finos sobre `lib/marketplace/{mensagens,favoritos}-actions.ts`). Os tipos resolvem corretamente e nada quebrou nos outros módulos.

**Nota de âmbito, para não confundir no futuro:** `/imoveis/mensagens`, `/imoveis/favoritos`, `/viaturas/mensagens`, `/viaturas/favoritos`, `/lup/mensagens`, `/lup/favoritos` também aparecem na lista de rotas, mas **não fazem parte desta fusão** — Lup, Viaturas e Imóveis continuam cada um com o seu próprio `actions.ts` independente (cópias próprias, não os wrappers). Só Gran Bazar e Mercado da Terra foram fundidos nesta ronda. Se a fusão for alargada no futuro, esses três módulos são candidatos óbvios ao mesmo tratamento — código ainda por confirmar se segue exatamente o mesmo padrão duplicado.

**Ainda por fazer:** teste manual dos fluxos de mensagens/favoritos ao vivo (`npm run dev`) — o build confirma que compila e resolve os tipos, não que o comportamento em runtime está correto.

---

## 20 — Atualização — 2026-08-27 — LACUNA-07: entidade_pedidos passa a usar profiles.role

**LACUNA-07 (secção 13) — fechada para `entidade_pedidos`, não para o projecto todo.** Ao investigar o RBAC inconsistente, foi confirmado exatamente o problema que a LACUNA apontava, e um caso concreto dele:

- `entidade_pedidos` (migration `20260823010000`, e a página `/admin/entidades` construída em 26/08) usavam `profiles.is_admin` (boolean).
- `reservas_alojamento` (RISCO-02, migration `20260826120000`) e `lib/supabase/middleware.ts` (obrigatoriedade de MFA) já usavam `profiles.role` (enum `user`/`moderator`/`admin`).

Isto não era só uma inconsistência cosmética: um operador que desse `role='admin'` a alguém (o mecanismo que o middleware e as reservas já usam) **não lhe dava acesso a `/admin/entidades`**, porque essa página e a RLS por trás dela só olhavam para `is_admin`. Nomeadamente, é possível que isto explique por que o teste manual de `/admin/entidades` (pendente desde 26/08) ainda não foi feito — se ninguém tem `is_admin=true` na base de dados, a página está inacessível a toda a gente, admin incluído.

**Ação tomada:**
- `supabase/migrations/20260827100000_entidade_pedidos_rls_usar_role.sql` (novo) — substitui a policy `"Administradores gerem todos os pedidos"` de `entidade_pedidos` para usar `profiles.role = 'admin'` em vez de `profiles.is_admin = true`. Só `'admin'`, não `'moderator'` — aprovar entidades parceiras é uma ação de maior confiança do que gerir reservas de alojamento.
- `app/admin/entidades/page.tsx` — atualizado em consonância: lê `profile.role` em vez de `profile.is_admin`.
- `profiles.is_admin` **não foi removido da tabela** — pode ainda ter outros usos não confirmados sem grep de árvore completa (LACUNA-01 nunca teve cobertura 100%). Só deixou de ser a fonte de verdade para `entidade_pedidos`.

**⚠️ Ação necessária do Yos antes de testar `/admin/entidades`:** confirmar que pelo menos uma conta tem `role = 'admin'` na tabela `profiles` (via SQL editor do Supabase: `update public.profiles set role = 'admin' where id = '<uuid da tua conta>';`). Ter `is_admin=true` deixou de ser suficiente.

**Por confirmar (fora do alcance desta sessão):** `npx supabase db push` da nova migration, e o teste manual do fluxo completo de Entidades Parceiras que já estava pendente desde 26/08.

**Continua em aberto:** esta correção resolveu só `entidade_pedidos`. Não foi feita uma pesquisa exaustiva por outros usos de `is_admin` no resto do código (sem `device_bash`) — se existirem, ficam com o mesmo tipo de inconsistência até serem encontrados e migrados para `role` também.
