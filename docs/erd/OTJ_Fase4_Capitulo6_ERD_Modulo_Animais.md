# OTJ — Fase 4
# Capítulo 6 — ERD do Módulo dos Animais

## Objetivo

Definir o diagrama ERD detalhado do módulo dos Animais, suportando a gestão de espécies, raças, animais, sanidade, reprodução e produção.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    SPECIES ||--o{ BREEDS : possui
    BREEDS ||--o{ ANIMALS : classifica
    PROFILES ||--o{ ANIMALS : proprietario

    ANIMALS ||--o{ HEALTH_RECORDS : possui
    ANIMALS ||--o{ REPRODUCTION : participa
    ANIMALS ||--o{ PRODUCTION_RECORDS : gera

    SPECIES {
        uuid id PK
        text nome
        text categoria
    }

    BREEDS {
        uuid id PK
        uuid species_id FK
        text nome
    }

    ANIMALS {
        uuid id PK
        uuid breed_id FK
        uuid owner_id FK
        text identificacao
        text nome
        text sexo
        date data_nascimento
        text estado
    }

    HEALTH_RECORDS {
        uuid id PK
        uuid animal_id FK
        text tipo
        date data
        text observacoes
    }

    REPRODUCTION {
        uuid id PK
        uuid animal_id FK
        date data
        text evento
        text observacoes
    }

    PRODUCTION_RECORDS {
        uuid id PK
        uuid animal_id FK
        text tipo
        numeric quantidade
        date data
    }
```

---

## Cardinalidades

- Espécie (1:N) Raças
- Raça (1:N) Animais
- Perfil (1:N) Animais
- Animal (1:N) Registos Sanitários
- Animal (1:N) Registos de Reprodução
- Animal (1:N) Registos de Produção

---

## Índices Recomendados

- breeds(species_id)
- animals(breed_id)
- animals(owner_id)
- animals(identificacao) UNIQUE
- health_records(animal_id)
- reproduction(animal_id)
- production_records(animal_id)

---

## Observações

Este módulo permite acompanhar todo o ciclo de vida dos animais, desde a identificação até ao histórico sanitário e produtivo.

---

## Próximo Capítulo

**Capítulo 7 — ERD do Módulo da Agenda e Eventos**.
