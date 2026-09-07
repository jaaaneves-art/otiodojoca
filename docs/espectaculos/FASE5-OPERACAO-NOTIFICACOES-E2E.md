# Espetáculos — Fase 5: Operação, Notificações e E2E

## Estado

Implementação local concluída e validada em 7 de setembro de 2026.

A Fase 5 reforça a operação do módulo Espetáculos sem ativar Stripe live, envio real de emails ou scheduler remoto.

## Implementado

### Outbox e notificações

- Estados `pending`, `processing`, `delivered`, `deferred` e `failed`.
- Claim concorrente com `FOR UPDATE SKIP LOCKED`.
- Lease com token, renovação e recuperação de leases expirados.
- Fencing de workers antigos.
- Contagem e limite de tentativas.
- Retry com backoff.
- Deduplicação.
- Erros persistidos apenas através de códigos permitidos.
- Worker de notificações desacoplado do transporte.
- Templates de notificações.
- Sem envio real de email por defeito.

### Manutenção

- Lease exclusivo para impedir execuções concorrentes.
- Processamento limitado de notificações.
- Reconciliação de pagamentos, reembolsos e eventos pendentes.
- Agendamento de novas tentativas.
- Métricas operacionais.
- Endpoint protegido existente reforçado.
- Nenhum scheduler remoto configurado.

### Organizador

- Resumo operacional por evento.
- Indicadores agregados de pagamentos pendentes, reembolsos, revisão financeira e notificações com problemas.
- Restrições por função mantidas.

### Check-in

- UX reforçada para utilização repetida do scanner.
- Estados de resultado explícitos.
- Bloqueio durante processamento.
- Reset entre leituras.
- Sem persistência intencional do token QR em localStorage/sessionStorage.

### Stripe

Continua exclusivamente em modo de teste.

Não foram ativadas chaves live nem efetuados pagamentos reais.

Foram adicionados testes para cenários financeiros e de reconciliação, incluindo falhas, atrasos, webhooks repetidos e reembolsos.

### Browser E2E

Foi adicionada infraestrutura Playwright exclusivamente local:

- `@playwright/test` como devDependency;
- Chromium;
- destino fixo em loopback;
- fixtures locais;
- bloqueio de rede externa;
- sem acesso a produção;
- sem utilização de segredos de produção.

A execução browser não foi concluída nesta sessão porque o servidor Next isolado ficou bloqueado em `app.prepare()` e o `webServer` atingiu o timeout de 180 segundos.

O bloqueio é da infraestrutura de arranque E2E; não foi registada uma falha funcional de um teste browser.

## Migration

Nova migration:

`20260907130000_espetaculos_fase5_operacao.sql`

A migration não foi aplicada ao Supabase remoto nesta fase de desenvolvimento local.

Não foram alteradas migrations anteriores.

## Validação

### SQL local descartável

Aprovado.

Foram validados:

- dois workers concorrentes com lotes distintos;
- fencing de tokens;
- renovação de lease;
- recuperação de lease expirado;
- proteção contra replay;
- sanitização de erros;
- backoff;
- limite de tentativas;
- deduplicação;
- isolamento do outbox;
- RPCs reservados ao service role;
- permissões do resumo operacional;
- exclusão mútua da manutenção.

### Vitest

35/35 testes específicos da Fase 5 aprovados:

- maintenance route;
- notification worker;
- Stripe flows;
- operation log.

### TypeScript

`npx tsc --noEmit` aprovado.

### Git

`git diff --check` aprovado.

### Build

`npm run build` aprovado com Next.js 16.3.1.

- compilação concluída;
- TypeScript concluído;
- 77/77 páginas estáticas geradas;
- nova rota operacional incluída.

## Segurança

- Nenhum segredo de produção introduzido.
- Stripe live continua recusado.
- Rede externa bloqueada na infraestrutura E2E.
- Outbox não é acessível por utilizadores browser.
- Operações de claim/renew/finish são reservadas ao `service_role`.
- Erros operacionais são sanitizados antes de persistência.
- Tokens de lease impedem workers antigos de concluir trabalho recuperado.
- Nenhum token QR deve ser persistido ou registado pela interface do scanner.

## Pendente

1. Resolver o arranque do servidor Next isolado usado pelo Playwright.
2. Executar a suite browser E2E local depois dessa correção.
3. Rever e aplicar a migration Fase 5 ao Supabase remoto antes de disponibilizar código que dependa dela.
4. Só depois fazer deploy da aplicação.
5. Configuração futura de transporte real de notificações e scheduler deve ser feita separadamente e com autorização explícita.
