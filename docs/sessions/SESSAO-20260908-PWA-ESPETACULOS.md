# Sessão — 2026-09-08 — PWA + Espetáculos

## PWA

Fase 1 — PASS
- manifest (`app/manifest.ts`)
- metadata e viewport
- ícones PWA provisórios e favicon

Fase 2 — PASS
- service worker manual
- `offline.html`
- cache restrito
- `PwaProvider`

Fase 3 — PASS
- `OfflineStatus`
- UX offline e retry manual
- nenhuma repetição de operações sensíveis

Fase 4 — PASS
- instalação com `beforeinstallprompt`
- deteção standalone
- orientação iOS
- atualização controlada
- `SKIP_WAITING` apenas por ação explícita
- proteção contra reload em fluxos sensíveis
- 18/18 testes

Fase 5 — PASS
- Chromium real PASS
- viewport 390x844 PASS
- manifest PASS
- Service Worker `activated` PASS
- offline/online PASS
- Cache Storage restrito PASS
- 18/18 testes
- Android físico NÃO TESTADO
- iPhone/iPad físico NÃO TESTADO

Correção real da Fase 5: `public/sw.js` deixou de abortar a instalação inteira
quando um asset individual é recusado por `no-store`, MIME ou indisponibilidade.
A política de segurança/cache não foi relaxada.

TypeScript mantém quatro erros pré-existentes fora do PWA, em:

- `components/marketplace/beleza-form.tsx`
- `components/marketplace/consultorio-form.tsx`
- `components/marketplace/mediacao-form.tsx`
- `components/marketplace/retailing-form.tsx`

Esses erros não são atribuídos ao PWA.

## ESPETÁCULOS

Estado até à Fase 5: fluxo local de Espetáculos validado com testes E2E e
duplos controlados; Stripe real não foi usado.

Fase 6:
- concluída localmente e agora versionada;
- Playwright corrigido;
- 5/5 E2E;
- Stripe por duplos;
- webhook;
- sem Stripe real.

Fase 7:
- PASS;
- 88/88 Vitest;
- 12/12 Playwright;
- TypeScript PASS nessa validação;
- ESLint PASS;
- build PASS;
- rascunho/cancelado;
- maintenance provider ativo;
- acessibilidade;
- segurança;
- RLS/permissões;
- nenhuma migration;
- Stripe TEST real NÃO;
- Stripe CLI NÃO.

## GIT

Commits criados nesta tarefa:

- Fase 6 — `beda87a` — `test(espetaculos): adicionar validacao E2E da fase 6`
- Fase 7 — `f5915f4` — `test(espetaculos): concluir validacao pre-producao da fase 7`
- PWA — `feb0eac` — `feat(pwa): adicionar instalacao offline e atualizacao controlada`
- Esta documentação é versionada no commit de documentação desta sessão.
