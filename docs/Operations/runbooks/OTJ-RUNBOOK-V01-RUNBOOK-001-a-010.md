# OTJ-RUNBOOK-V01 — RUNBOOK-001 a RUNBOOK-010

# Runbooks Operacionais

## RUNBOOK-001 — Deploy da Plataforma
**Objetivo:** Publicar uma nova versão em produção.
**Passos:**
1. Validar pipeline CI.
2. Confirmar aprovação.
3. Executar deploy.
4. Verificar saúde dos serviços.
5. Confirmar sucesso.

---

## RUNBOOK-002 — Rollback
**Objetivo:** Reverter para a última versão estável.
**Passos:** Identificar versão anterior, executar rollback, validar serviços, comunicar conclusão.

---

## RUNBOOK-003 — Backup
**Objetivo:** Executar backups automáticos e manuais.
**Verificações:** Integridade, retenção e armazenamento externo.

---

## RUNBOOK-004 — Restore
**Objetivo:** Restaurar dados a partir de backup validado.
**Passos:** Selecionar backup, restaurar, validar consistência.

---

## RUNBOOK-005 — PostgreSQL
Procedimentos de manutenção, vacuum, índices, monitorização e recuperação.

---

## RUNBOOK-006 — Supabase
Gestão de autenticação, armazenamento, políticas RLS, migrações e monitorização.

---

## RUNBOOK-007 — Redis
Inicialização, limpeza de cache, persistência e monitorização.

---

## RUNBOOK-008 — Docker
Construção de imagens, publicação, atualização e limpeza.

---

## RUNBOOK-009 — Kubernetes
Escalabilidade, rollout, rollback, verificação de pods e serviços.

---

## RUNBOOK-010 — Monitorização
Verificação de métricas, logs, alertas, dashboards e disponibilidade.

## Revisão
Todos os Runbooks devem ser testados periodicamente e atualizados após alterações relevantes.
