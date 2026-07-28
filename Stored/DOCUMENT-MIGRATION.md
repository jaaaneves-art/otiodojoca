# DOCUMENT-MIGRATION.md

# Plano de Migração da Documentação OTJ

Versão: 1.0

Estado: Pendente

---

# Objetivo

Definir a sequência oficial para migrar a documentação produzida durante a auditoria para o repositório OTJ.

---

# Princípios

- Nenhuma alteração manual.
- Migração apenas por scripts PowerShell.
- Operação reproduzível.
- Possibilidade de rollback.
- Preservação do histórico Git.

---

# Etapas

## Fase 1

- Validar DOCUMENT-INVENTORY.md
- Validar DOCUMENT-AUDIT.md
- Validar DOCUMENT-MAP.md

## Fase 2

- Criar estrutura final.
- Mover documentos.
- Atualizar índices.

## Fase 3

- Rever links.
- Validar documentação.
- Commit final.

---

# Checklist

- [ ] Inventário concluído
- [ ] Auditoria concluída
- [ ] Mapeamento concluído
- [ ] Scripts testados
- [ ] Rollback validado
- [ ] Migração aprovada

---

# Histórico

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-07-27 | 1.0 | Criação do plano de migração. |
