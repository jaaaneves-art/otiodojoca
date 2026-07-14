# OTJ — Fase 4
# Capítulo 8 — ERD do Módulo das Entidades Institucionais

## Objetivo

Definir o diagrama ERD detalhado das entidades institucionais da plataforma OTJ, permitindo gerir organismos oficiais, associações e os seus representantes.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    INSTITUTION_TYPES ||--o{ INSTITUTIONS : classifica
    PLACES ||--o{ INSTITUTIONS : localiza

    INSTITUTIONS ||--o{ INSTITUTION_MEMBERS : possui
    PROFILES ||--o{ INSTITUTION_MEMBERS : representa

    INSTITUTIONS ||--o{ INSTITUTION_POSTS : publica
    PROFILES ||--o{ INSTITUTION_POSTS : autor

    INSTITUTION_TYPES {
        uuid id PK
        text nome
        text descricao
    }

    INSTITUTIONS {
        uuid id PK
        uuid institution_type_id FK
        uuid place_id FK
        text nome
        text descricao
        text email
        text telefone
        text website
        text estado
    }

    INSTITUTION_MEMBERS {
        uuid id PK
        uuid institution_id FK
        uuid profile_id FK
        text funcao
        date data_inicio
        date data_fim
    }

    INSTITUTION_POSTS {
        uuid id PK
        uuid institution_id FK
        uuid autor_id FK
        text titulo
        text conteudo
        timestamp publicado_em
    }
```

---

## Cardinalidades

- Tipo de Entidade (1:N) Entidades
- Lugar (1:N) Entidades
- Entidade (1:N) Representantes
- Perfil (1:N) Representações
- Entidade (1:N) Publicações
- Perfil (1:N) Publicações

---

## Índices Recomendados

- institutions(institution_type_id)
- institutions(place_id)
- institutions(nome)
- institution_members(institution_id)
- institution_members(profile_id)
- institution_posts(institution_id)
- institution_posts(autor_id)

---

## Observações

Este módulo permite às entidades institucionais gerir conteúdos, eventos e informação oficial, mantendo uma ligação direta ao território e aos respetivos representantes.

---

## Próximo Capítulo

**Capítulo 9 — ERD do Módulo do Marketplace**.
