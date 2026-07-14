# OTJ — Fase 4
# Capítulo 12 — ERD do Módulo das Notificações

## Objetivo

Definir o diagrama ERD detalhado do módulo de Notificações da plataforma OTJ, permitindo gerir alertas, mensagens internas, emails e notificações push.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    PROFILES ||--o{ NOTIFICATION_PREFERENCES : configura
    NOTIFICATION_TYPES ||--o{ NOTIFICATION_PREFERENCES : define

    PROFILES ||--o{ NOTIFICATIONS : recebe
    NOTIFICATION_TYPES ||--o{ NOTIFICATIONS : classifica

    NOTIFICATIONS ||--o{ NOTIFICATION_DELIVERIES : gera

    NOTIFICATION_TYPES {
        uuid id PK
        text nome
        text descricao
    }

    NOTIFICATION_PREFERENCES {
        uuid id PK
        uuid profile_id FK
        uuid tipo_id FK
        boolean email
        boolean push
        boolean interna
    }

    NOTIFICATIONS {
        uuid id PK
        uuid profile_id FK
        uuid tipo_id FK
        text titulo
        text mensagem
        timestamp criada_em
        timestamp lida_em
    }

    NOTIFICATION_DELIVERIES {
        uuid id PK
        uuid notification_id FK
        text canal
        text estado
        timestamp enviada_em
    }
```

---

## Cardinalidades

- Perfil (1:N) Preferências
- Tipo de Notificação (1:N) Preferências
- Perfil (1:N) Notificações
- Tipo de Notificação (1:N) Notificações
- Notificação (1:N) Entregas

---

## Índices Recomendados

- notification_preferences(profile_id, tipo_id)
- notifications(profile_id)
- notifications(tipo_id)
- notifications(criada_em)
- notification_deliveries(notification_id)
- notification_deliveries(estado)

---

## Observações

Este módulo centraliza todas as comunicações da plataforma e permite adicionar novos canais de entrega sem alterar o restante sistema.

---

## Próximo Capítulo

**Capítulo 13 — ERD do Módulo da Administração**.
