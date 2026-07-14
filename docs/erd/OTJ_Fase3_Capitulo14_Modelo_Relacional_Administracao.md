# OTJ — Fase 3
# Capítulo 14 — Modelo Relacional da Administração

## Objetivo

Definir o modelo relacional do módulo de Administração da plataforma OTJ, responsável pela configuração global, auditoria, monitorização, segurança e gestão operacional.

---

# Estrutura Geral

```text
Configurações
      │
Utilizadores
      │
Auditoria
      │
Logs
      │
Backups
      │
Monitorização
```

---

# 1. system_settings

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| chave | TEXT | Única |
| valor | TEXT | |
| descricao | TEXT | Opcional |
| atualizado_em | TIMESTAMP | |

---

# 2. audit_logs

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| profile_id | UUID | FK → profiles.id |
| entidade | TEXT | Tabela ou módulo |
| entidade_id | UUID | Opcional |
| acao | TEXT | CREATE, UPDATE, DELETE, LOGIN... |
| detalhes | JSONB | Informação adicional |
| criado_em | TIMESTAMP | |

---

# 3. system_logs

| Campo | Tipo |
|-------|------|
| id | UUID |
| nivel | TEXT |
| origem | TEXT |
| mensagem | TEXT |
| criado_em | TIMESTAMP |

Exemplos de nível:
- INFO
- WARNING
- ERROR
- CRITICAL

---

# 4. backups

| Campo | Tipo |
|-------|------|
| id | UUID |
| tipo | TEXT |
| localizacao | TEXT |
| tamanho | BIGINT |
| criado_em | TIMESTAMP |
| estado | TEXT |

---

# 5. monitoring

| Campo | Tipo |
|-------|------|
| id | UUID |
| componente | TEXT |
| estado | TEXT |
| ultima_verificacao | TIMESTAMP |
| observacoes | TEXT |

---

# Relações Principais

- Perfil → Auditoria (1:N)
- Configurações → Sistema
- Logs → Componentes
- Backups → Sistema
- Monitorização → Componentes

---

## Evolução Futura

Este módulo poderá incluir:
- Painel de administração
- Gestão de permissões avançadas
- Alertas de segurança
- Estatísticas de utilização
- Monitorização de desempenho
- Recuperação automática de backups
- Integração com serviços externos

---

## Conclusão da Fase 3

Com este capítulo fica concluído o modelo relacional base dos principais módulos do OTJ.

### Próxima Fase

**Fase 4 — Diagramas ERD Detalhados**, onde cada módulo será transformado em diagramas ERD completos, com cardinalidades, chaves primárias, chaves estrangeiras e relações visuais.
