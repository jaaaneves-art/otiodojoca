# Pendentes — 2026-09-08 — PWA + Espetáculos

## PWA

- teste físico Android em HTTPS;
- teste físico iPhone/iPad Safari em HTTPS;
- confirmar instalação pelo ícone;
- confirmar standalone real;
- testar offline/online físico;
- confirmar offline fallback em produção HTTPS;
- testar atualização real com worker waiting;
- verificar Manifest, Service Workers e Cache Storage em produção;
- push notifications continuam fora do âmbito;
- background sync continua fora do âmbito.

## ESPETÁCULOS — antes de Stripe Live

1. Stripe TEST real.
2. Stripe CLI e webhook real local.
3. E2E `next build` + `next start`.
4. Rever/alterar explicitamente `stripeConfigured()` antes de live.
5. Credenciais live apenas em ambiente seguro.
6. Webhook secret de produção.
7. `ESPECTACULOS_QR_KEY_V1` de produção.
8. Scheduler de manutenção em produção.
9. RLS/grants em staging com papéis/dados reais.
10. SendGrid quando o domínio estiver resolvido.
11. Teste de carga/concorrência de check-in/webhook.

Stripe Live NÃO está autorizado.

## Commits desta sessão

- Fase 6: `beda87a`
- Fase 7: `f5915f4`
- PWA: `feb0eac`
- Documentação desta sessão incluída no commit de documentação.
