# OTJ — Fase 3
# Capítulo 13 — Modelo Relacional das Notificações

## Objetivo

Definir o modelo relacional do sistema de notificações da plataforma OTJ, permitindo comunicar com os utilizadores através de alertas, mensagens internas, emails e notificações push.

---

# Estrutura Geral

```text
Perfil
   │
Preferências
   │
Notificação
   │
Entrega
```

---

# 1. notification_types

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| descricao | TEXT | Opcional |

Exemplos:
- Sistema
- Fórum
- Agricultura
- Animais
- Marketplace
- Eventos

---

# 2. notification_preferences

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| profile_id | UUID | FK → profiles.id |
| tipo_id | UUID | FK → notification_types.id |
| email | BOOLEAN | |
| push | BOOLEAN | |
| interna | BOOLEAN | |

---

# 3. notifications

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| profile_id | UUID | FK → profiles.id |
| tipo_id | UUID | FK → notification_types.id |
| titulo | TEXT | |
| mensagem | TEXT | |
| criada_em | TIMESTAMP | |
| lida_em | TIMESTAMP | Opcional |

---

# 4. notification_deliveries

| Campo | Tipo |
|-------|------|
| id | UUID |
| notification_id | UUID |
| canal | TEXT |
| estado | TEXT |
| enviada_em | TIMESTAMP |

Exemplos de canal:
- Interna
- Email
- Push
- SMS (futuro)

---

# Relações Principais

- Perfil → Preferências (1:N)
- Perfil → Notificações (1:N)
- Tipo → Notificações (1:N)
- Notificação → Entregas (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Agendamento de notificações
- Alertas inteligentes
- Resumos diários
- Notificações em tempo real
- Integração com aplicações móveis

---

## Próximo Capítulo

**Capítulo 14 — Modelo Relacional da Administração**, dedicado à configuração da plataforma, auditoria, registos, permissões avançadas e monitorização.
