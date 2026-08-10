# OTJ — Fase 3
# Capítulo 8 — Modelo Relacional da Agenda e Eventos

## Objetivo

Definir o modelo relacional para a gestão de eventos da plataforma OTJ, permitindo organizar e divulgar feiras, festas, romarias, mercados, exposições e outras iniciativas locais.

---

# Estrutura Geral

```text
Organização
      │
Categoria de Evento
      │
Evento
      │
Programa
      │
Participantes
```

---

# 1. event_categories

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| descricao | TEXT | Opcional |

---

# 2. organizations

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | |
| tipo | TEXT | Câmara, Junta, Associação, Cooperativa, etc. |
| place_id | UUID | FK → places.id |

---

# 3. events

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| category_id | UUID | FK → event_categories.id |
| organization_id | UUID | FK → organizations.id |
| place_id | UUID | FK → places.id |
| titulo | TEXT | |
| descricao | TEXT | |
| data_inicio | TIMESTAMP | |
| data_fim | TIMESTAMP | |
| estado | TEXT | Planeado, Publicado, Cancelado, Concluído |

Relações:
- event_categories (1) → (N) events
- organizations (1) → (N) events
- places (1) → (N) events

---

# 4. event_program

| Campo | Tipo |
|-------|------|
| id | UUID |
| event_id | UUID |
| titulo | TEXT |
| descricao | TEXT |
| inicio | TIMESTAMP |
| fim | TIMESTAMP |

Relação:
- events (1) → (N) event_program

---

# 5. event_participants

| Campo | Tipo |
|-------|------|
| id | UUID |
| event_id | UUID |
| profile_id | UUID |
| funcao | TEXT |

Exemplos:
- Organizador
- Expositor
- Artista
- Voluntário
- Participante

---

# Relações Principais

- Categoria → Eventos (1:N)
- Organização → Eventos (1:N)
- Evento → Programa (1:N)
- Evento → Participantes (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Inscrições online
- Bilhetes
- Pagamentos
- Calendário público
- Mapas
- Notificações
- Avaliações dos eventos

---

## Próximo Capítulo

**Capítulo 9 — Modelo Relacional das Entidades Institucionais**, dedicado a câmaras municipais, juntas de freguesia, cooperativas, associações e restantes entidades parceiras.
