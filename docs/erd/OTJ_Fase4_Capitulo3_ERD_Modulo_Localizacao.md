# OTJ — Fase 4
# Capítulo 3 — ERD do Módulo de Localização

## Objetivo

Definir o diagrama ERD detalhado da hierarquia territorial do OTJ, que servirá de base para todos os módulos que dependem da localização.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    COUNTRIES ||--o{ DISTRICTS : contem
    DISTRICTS ||--o{ MUNICIPALITIES : contem
    MUNICIPALITIES ||--o{ PARISHES : contem
    PARISHES ||--o{ PLACES : contem

    COUNTRIES {
        uuid id PK
        text nome
        text codigo_iso UK
    }

    DISTRICTS {
        uuid id PK
        uuid country_id FK
        text nome
    }

    MUNICIPALITIES {
        uuid id PK
        uuid district_id FK
        text nome
    }

    PARISHES {
        uuid id PK
        uuid municipality_id FK
        text nome
    }

    PLACES {
        uuid id PK
        uuid parish_id FK
        text nome
    }
```

---

## Cardinalidades

- Country (1:N) Districts
- District (1:N) Municipalities
- Municipality (1:N) Parishes
- Parish (1:N) Places

---

## Índices Recomendados

- countries.codigo_iso (UNIQUE)
- districts(country_id, nome)
- municipalities(district_id, nome)
- parishes(municipality_id, nome)
- places(parish_id, nome)

---

## Utilização

Este módulo será referenciado por:

- Perfis
- Explorações agrícolas
- Animais
- Eventos
- Instituições
- Marketplace
- Turismo

Centralizar a localização evita duplicação de dados e garante consistência em toda a plataforma.

---

## Próximo Capítulo

**Capítulo 4 — ERD do Módulo da Comunidade**.
