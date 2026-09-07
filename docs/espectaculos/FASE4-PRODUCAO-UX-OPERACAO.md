# ESPETÁCULOS — Fase 4, validação local (2026-09-07)

Implementação local, sem commit/push/merge/deploy, sem operações no Supabase remoto e sem alterações de migrations anteriores. Não foram instaladas dependências. Alterações pré-existentes e módulos fora do âmbito não foram editados.

## Entregue

- Detalhe público em `/espectaculos/eventos/[id]`: descrição, organização, local por sessão, estados, preços e disponibilidade. Projeções SQL explícitas excluem rascunhos e tipos internos mesmo para membros autenticados. Eventos cancelados continuam consultáveis pelo endereço.
- Checkout: resumo dos itens de uma única sessão, subtotal, taxas adicionais do comprador e total; contador; bloqueio por expiração/revisão/estado final. Comissão do organizador não é apresentada como taxa adicional ao comprador. Erros do prestador aparecem no formulário; o estado financeiro persistido mantém os estados da Fase 3.
- Comprador: histórico paginado (25 por página), resumo, bilhetes; detalhe individual com local, estado, check-in e impressão/Guardar como PDF do navegador. O QR só é gerado para bilhete válido sem revisão financeira.
- Organizador: stock agregado e por sessão para manager/finance/owner/admin; valores financeiros apenas para finance/owner/admin, omitidos na resposta SQL aos managers. Checkin não obtém este resumo. Lista e detalhe de encomendas com datas, estados em pt-PT e pedido de reembolso com botão pendente.
- Scanner: feedback sem identidade do comprador, trava síncrona no cliente e proteção transacional da Fase 3. Diagnóstico de outra sessão limitado à mesma organização; bilhetes de outra organização permanecem inválidos. Sessão cancelada nunca aceita entrada.
- Notificações: outbox transacional com chave única por ocorrência, RLS sem acesso de utilizadores; reserva, pagamento, emissão, cancelamento e reembolso. Serviço/transport desacoplado e adaptador para a infraestrutura de email existente, sem alterar esse serviço nem as suas configurações. Transporte predefinido adia e nunca marca como enviado.
- Stripe: `ESPECTACULOS_STRIPE_MODE` explícito (ausente = test), qualquer modo diferente de test falha fechado. Chaves live continuam recusadas. Webhook e reconciliação autenticada com o prestador continuam as únicas vias de confirmação financeira paga; retorno do navegador não confirma pagamentos.
- Manutenção: expiração, reconciliação de pagamentos vencidos, reembolsos e eventos pendentes; contabiliza notificações adiadas e itens libertados, interrompe novos itens após orçamento suave de 40 segundos. Endpoint POST existente protegido com comparação em tempo constante; nenhum scheduler criado.

## Migration nova

`supabase/migrations/20260907120000_espetaculos_fase4_operacao.sql`

Necessária para projeção pública de eventos cancelados, agregados operacionais sem expor finanças ao manager, diagnóstico seguro de check-in e persistência transacional de notificações. Aplicada **apenas** em `otj_espectaculos_fase3_test` no Docker local. A base descartável foi recriada copiando somente o schema local e repondo os grants das migrations. Não há backfill de emails para encomendas históricas.

## Validação

- `vitest run lib/espectaculos`: 36 testes aprovados (18 já existentes + 18 novos).
- `python3 scripts/espectaculos/verify-phase4-local.py`: 72 verificações aprovadas (52 da Fase 3 reutilizadas + 20 da Fase 4). Inclui concorrência de stock, reembolso/check-in, idempotência, RLS, projeções públicas, resumos por papel, outbox e cancelamento.
- ESLint de `app/espectaculos`, `components/espectaculos`, `lib/espectaculos`, `app/api/espectaculos`: aprovado.
- TypeScript (`tsc --noEmit`): aprovado.
- `npm run build`: executado; Turbopack bloqueado pelo ambiente ao abrir uma porta local, mesmo após repetição autorizada.
- `npm run build -- --webpack`: aprovado, incluindo compilação, TypeScript e páginas. Usa URL Supabase loopback indisponível, chave pública fictícia, Stripe desativado e telemetria desativada. Nenhuma configuração do projeto foi alterada para este fallback.
- `git diff --check`: aprovado no âmbito desta fase.

## Revisão de segurança

Leituras do comprador usam sessão autenticada, RLS e filtro explícito buyer_id; IDs de bilhete/encomenda não substituem autorização. Não há token_hash nos selects ou props da UI. Apenas a chave publicável e o client_secret específico do PaymentIntent chegam ao formulário Stripe; a chave secreta, os hashes e as chaves de assinatura QR ficam no servidor. As respostas do scanner são projeções mínimas. Funções SECURITY DEFINER novas têm search_path vazio, grants explícitos e autorização no SQL quando não públicas. Outbox não tem acesso anon/authenticated. O pedido de pagamento recusa também revisão manual no servidor. Os testes confirmam que manager/checkin não leem encomendas financeiras de outros compradores. Ações financeiras e stock continuam a usar os RPCs transacionais existentes.

## Riscos e pendentes para produção

- Aplicar a migration nova num processo de release autorizado antes de disponibilizar estas páginas; isso NÃO foi feito remotamente.
- Validar Stripe test end-to-end (webhooks, cartão recusado, 3DS, timeout e reconciliação) com conta de teste autorizada. Não foi contactado um prestador externo nesta sessão.
- Configurar futuramente entrega da outbox: worker com lease/claim, tentativas/backoff e deduplicação no transporte antes de ligar o adaptador de email. O adaptador existente não promete exactly-once. Não há envio, destinatários resolvidos, segredos ou scheduler configurados. O serviço de email reutilizado já existia como alteração local não versionada.
- Configurar posteriormente agendamento/alertas e monitorizar `pendingReview`, `interrupted` e `notificationsDeferred`. O orçamento de manutenção é suave e não cancela uma chamada Stripe já iniciada. Lotes fixos de 25 podem exigir intervenção se os registos mais antigos falharem repetidamente; tentativas incertas com mais de 23 horas continuam a exigir reconciliação manual.
- O líquido é estimado antes dos custos do prestador, incluindo estimativa proporcional da comissão devolvida; não é saldo contabilístico nem valor exato de transferência. Validar política financeira e arredondamentos antes de usar em contabilidade. Stock vendido continua comprometido após reembolso, conforme Fase 3.
- Validar UX em telemóveis reais, permissões de câmara, leitura física do QR e impressão/PDF. Não foram executados testes de navegador com sessão autenticada nem pagamentos reais.
- A agenda mantém o limite existente de 24 próximos eventos; a lista financeira mantém os 100 mais recentes. O histórico do comprador já é paginado.
- Live permanece deliberadamente indisponível; ativação futura exige revisão de segregação dos ambientes e testes próprios. Não basta definir MODE=live.

## Ficheiros alterados/criados nesta fase

- `app/espectaculos/bilhetes/[ticketId]/page.tsx`
- `app/espectaculos/checkout/[orderId]/page.tsx`
- `app/espectaculos/encomendas/[orderId]/page.tsx`
- `app/espectaculos/encomendas/page.tsx`
- `app/espectaculos/eventos/[id]/page.tsx`
- `app/espectaculos/loading.tsx`
- `app/espectaculos/organizador/eventos/[id]/encomendas/[orderId]/page.tsx`
- `app/espectaculos/organizador/eventos/[id]/encomendas/page.tsx`
- `app/espectaculos/organizador/eventos/[id]/page.tsx`
- `app/espectaculos/page.tsx`
- `components/espectaculos/checkin-scanner.tsx`
- `components/espectaculos/order-summary.tsx`
- `components/espectaculos/payment-form.tsx`
- `components/espectaculos/print-ticket.tsx`
- `components/espectaculos/refund-form.tsx`
- `components/espectaculos/reservation-clock.tsx`
- `components/espectaculos/sales-summary.tsx`
- `components/espectaculos/submit-button.tsx`
- `components/espectaculos/ticket-selector.tsx`
- `lib/espectaculos/actions.ts`
- `lib/espectaculos/notifications.ts`
- `lib/espectaculos/operation.test.ts`
- `lib/espectaculos/payments.ts`
- `lib/espectaculos/presentation.test.ts`
- `lib/espectaculos/presentation.ts`
- `lib/espectaculos/queries.ts`
- `lib/espectaculos/reconciliation.ts`
- `lib/espectaculos/types.ts`
- `scripts/espectaculos/verify-phase4-local.py`
- `supabase/migrations/20260907120000_espetaculos_fase4_operacao.sql`
- `docs/espectaculos/FASE4-PRODUCAO-UX-OPERACAO.md`
