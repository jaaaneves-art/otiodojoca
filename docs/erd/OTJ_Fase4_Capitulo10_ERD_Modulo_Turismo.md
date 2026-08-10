# OTJ — Fase 4
# Capítulo 10 — ERD do Módulo do Turismo

## Objetivo

Definir o diagrama ERD detalhado do módulo de Turismo da plataforma OTJ, suportando alojamentos, restaurantes, pontos de interesse, trilhos e experiências.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    TOURISM_CATEGORIES ||--o{ TOURISM_PLACES : classifica
    PLACES ||--o{ TOURISM_PLACES : localiza

    TOURISM_PLACES ||--o{ TOURISM_IMAGES : possui
    TOURISM_PLACES ||--o{ EXPERIENCES : oferece

    PLACES ||--o{ TRAILS : origem
    PLACES ||--o{ TRAILS : destino

    TOURISM_CATEGORIES {
        uuid id PK
        text nome
        text descricao
    }

    TOURISM_PLACES {
        uuid id PK
        uuid category_id FK
        uuid place_id FK
        text nome
        text morada
        text telefone
        text email
        text website
        text estado
    }

    TRAILS {
        uuid id PK
        uuid origem_place_id FK
        uuid destino_place_id FK
        text nome
        numeric distancia_km
        text dificuldade
    }

    EXPERIENCES {
        uuid id PK
        uuid tourism_place_id FK
        text titulo
        text descricao
        numeric preco
        text duracao
    }

    TOURISM_IMAGES {
        uuid id PK
        uuid tourism_place_id FK
        text ficheiro
        text legenda
    }
```

---

## Cardinalidades

- Categoria de Turismo (1:N) Locais Turísticos
- Lugar (1:N) Locais Turísticos
- Local Turístico (1:N) Imagens
- Local Turístico (1:N) Experiências
- Lugar (1:N) Trilhos (origem e destino)

---

## Índices Recomendados

- tourism_places(category_id)
- tourism_places(place_id)
- trails(origem_place_id)
- trails(destino_place_id)
- experiences(tourism_place_id)
- tourism_images(tourism_place_id)

---

## Observações

Este módulo integra-se com Agenda e Eventos, Marketplace e Notificações, permitindo promover o património, o turismo rural e as atividades locais.

---

## Próximo Capítulo

**Capítulo 11 — ERD do Módulo da Biblioteca e Conteúdos**.
