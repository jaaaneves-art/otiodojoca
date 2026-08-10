# OTJ — Fase 4
# Capítulo 7 — ERD do Módulo da Agenda e Eventos

## Objetivo

Definir o diagrama ERD detalhado do módulo da Agenda e Eventos, permitindo gerir feiras, festas, romarias, mercados, exposições e outras iniciativas.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    EVENT_CATEGORIES ||--o{ EVENTS : classifica
    ORGANIZATIONS ||--o{ EVENTS : organiza
    PLACES ||--o{ EVENTS : localiza

    EVENTS ||--o{ EVENT_PROGRAM : possui
    EVENTS ||--o{ EVENT_PARTICIPANTS : inclui
    PROFILES ||--o{ EVENT_PARTICIPANTS : participa

    EVENT_CATEGORIES {
        uuid id PK
        text nome
        text descricao
    }

    ORGANIZATIONS {
        uuid id PK
        text nome
        text tipo
        uuid place_id FK
    }

    EVENTS {
        uuid id PK
        uuid category_id FK
        uuid organization_id FK
        uuid place_id FK
        text titulo
        timestamp data_inicio
        timestamp data_fim
        text estado
    }

    EVENT_PROGRAM {
        uuid id PK
        uuid event_id FK
        text titulo
        text descricao
        timestamp inicio
        timestamp fim
    }

    EVENT_PARTICIPANTS {
        uuid id PK
        uuid event_id FK
        uuid profile_id FK
        text funcao
    }
```

---

## Cardinalidades

- Categoria de Evento (1:N) Eventos
- Organização (1:N) Eventos
- Lugar (1:N) Eventos
- Evento (1:N) Programa
- Evento (1:N) Participantes
- Perfil (1:N) Participações

---

## Índices Recomendados

- events(category_id)
- events(organization_id)
- events(place_id)
- events(data_inicio)
- event_program(event_id)
- event_participants(event_id)
- event_participants(profile_id)

---

## Observações

Este módulo centraliza a divulgação e gestão de eventos locais, permitindo integração com instituições, turismo e notificações.

---

## Próximo Capítulo

**Capítulo 8 — ERD do Módulo das Entidades Institucionais**.
