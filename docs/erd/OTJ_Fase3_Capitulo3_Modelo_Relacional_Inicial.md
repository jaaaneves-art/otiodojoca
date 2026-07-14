# OTJ — Fase 3
# Capítulo 3 — Modelo Relacional Inicial

## Objetivo

Definir a estrutura base da base de dados através das primeiras tabelas, respetivas chaves primárias (PK), chaves estrangeiras (FK) e relações fundamentais.

---

# 1. users

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| email | TEXT | Único |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

---

# 2. profiles

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| nome | TEXT | Nome apresentado |
| avatar | TEXT | URL da imagem |
| telefone | TEXT | Opcional |
| freguesia_id | UUID | FK |
| created_at | TIMESTAMP | |

**Relação:**  
- users (1) → (1) profiles

---

# 3. roles

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| descricao | TEXT | |

---

# 4. permissions

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| codigo | TEXT | Único |
| descricao | TEXT | |

---

# 5. role_permissions

Tabela de ligação entre papéis e permissões.

| Campo | Tipo |
|-------|------|
| role_id | UUID |
| permission_id | UUID |

PK composta:
- role_id
- permission_id

---

# 6. profile_roles

Tabela de ligação entre perfis e papéis.

| Campo | Tipo |
|-------|------|
| profile_id | UUID |
| role_id | UUID |

PK composta:
- profile_id
- role_id

---

# Relações Principais

- users (1:1) profiles
- profiles (N:N) roles
- roles (N:N) permissions

Este conjunto constitui o núcleo de autenticação e autorização do OTJ, servindo de base para todos os restantes módulos.

---

## Próximo Capítulo

**Capítulo 4 — Modelo Relacional da Localização**, onde serão definidas as tabelas de país, distrito, concelho, freguesia e lugar.
