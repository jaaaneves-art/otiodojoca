# OTJ — Fase 4
# Capítulo 13 — ERD do Módulo da Administração

## Objetivo

Definir o diagrama ERD detalhado do módulo de Administração, responsável pela configuração, auditoria, monitorização, segurança e operação da plataforma OTJ.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    PROFILES ||--o{ AUDIT_LOGS : executa

    SYSTEM_SETTINGS {
        uuid id PK
        text chave UK
        text valor
        text descricao
        timestamp atualizado_em
    }

    AUDIT_LOGS {
        uuid id PK
        uuid profile_id FK
        text entidade
        uuid entidade_id
        text acao
        jsonb detalhes
        timestamp criado_em
    }

    SYSTEM_LOGS {
        uuid id PK
        text nivel
        text origem
        text mensagem
        timestamp criado_em
    }

    BACKUPS {
        uuid id PK
        text tipo
        text localizacao
        bigint tamanho
        text estado
        timestamp criado_em
    }

    MONITORING {
        uuid id PK
        text componente
        text estado
        timestamp ultima_verificacao
        text observacoes
    }
```

---

## Cardinalidades

- Perfil (1:N) Auditoria
- Configurações → Sistema
- Logs → Sistema
- Backups → Sistema
- Monitorização → Sistema

---

## Índices Recomendados

- system_settings(chave) UNIQUE
- audit_logs(profile_id)
- audit_logs(entidade)
- audit_logs(criado_em)
- system_logs(nivel)
- monitoring(componente)
- backups(criado_em)

---

## Observações

Este módulo fornece mecanismos de gestão e supervisão da plataforma, garantindo rastreabilidade, segurança e suporte operacional.

---

## Próximo Capítulo

**Capítulo 14 — ERD Global da Plataforma OTJ**.
