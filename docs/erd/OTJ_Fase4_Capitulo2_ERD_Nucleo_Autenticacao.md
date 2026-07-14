# OTJ — Fase 4
# Capítulo 2 — ERD do Núcleo de Autenticação

## Objetivo

Definir o primeiro diagrama ERD detalhado do OTJ, correspondente ao núcleo de autenticação e autorização da plataforma.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    USERS ||--|| PROFILES : possui
    PROFILES }o--o{ ROLES : tem
    ROLES }o--o{ PERMISSIONS : concede

    USERS {
        uuid id PK
        text email UK
        timestamp created_at
        timestamp updated_at
    }

    PROFILES {
        uuid id PK
        uuid user_id FK
        text nome
        text avatar
        text telefone
        uuid parish_id FK
        timestamp created_at
    }

    ROLES {
        uuid id PK
        text nome UK
        text descricao
    }

    PERMISSIONS {
        uuid id PK
        text codigo UK
        text descricao
    }

    PROFILE_ROLES {
        uuid profile_id FK
        uuid role_id FK
    }

    ROLE_PERMISSIONS {
        uuid role_id FK
        uuid permission_id FK
    }

    PROFILES ||--o{ PROFILE_ROLES : associa
    ROLES ||--o{ PROFILE_ROLES : inclui

    ROLES ||--o{ ROLE_PERMISSIONS : associa
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : inclui
```

---

## Cardinalidades

- Users (1:1) Profiles
- Profiles (N:N) Roles
- Roles (N:N) Permissions

---

## Índices Recomendados

- users.email (UNIQUE)
- profiles.user_id (UNIQUE)
- roles.nome (UNIQUE)
- permissions.codigo (UNIQUE)
- profile_roles(profile_id, role_id)
- role_permissions(role_id, permission_id)

---

## Observações

Este módulo serve de base para todo o controlo de acesso da plataforma e será utilizado por todos os restantes módulos.

---

## Próximo Capítulo

**Capítulo 3 — ERD do Módulo de Localização**.
