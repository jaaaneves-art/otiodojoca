# OTJ — Fase 4
# Capítulo 5 — ERD do Módulo da Agricultura

## Objetivo

Definir o diagrama ERD detalhado do módulo de Agricultura, abrangendo explorações, parcelas, culturas, tarefas e registos agrícolas.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    PROFILES ||--o{ FARMS : possui
    PLACES ||--o{ FARMS : localiza

    FARMS ||--o{ PLOTS : contem
    PLOTS ||--o{ CROPS : produz

    CROPS ||--o{ CULTIVATION_TASKS : planeia
    CROPS ||--o{ CULTIVATION_LOG : regista
    CULTIVATION_TASKS ||--o{ CULTIVATION_LOG : referencia

    FARMS {
        uuid id PK
        uuid profile_id FK
        uuid place_id FK
        text nome
        text descricao
    }

    PLOTS {
        uuid id PK
        uuid farm_id FK
        text nome
        numeric area
        text unidade
    }

    CROPS {
        uuid id PK
        uuid plot_id FK
        text especie
        text variedade
        date data_inicio
        text estado
    }

    CULTIVATION_TASKS {
        uuid id PK
        uuid crop_id FK
        text tipo
        date data_prevista
        date data_execucao
        text estado
    }

    CULTIVATION_LOG {
        uuid id PK
        uuid crop_id FK
        uuid task_id FK
        text observacoes
        timestamp criado_em
    }
```

---

## Cardinalidades

- Perfil (1:N) Explorações
- Lugar (1:N) Explorações
- Exploração (1:N) Parcelas
- Parcela (1:N) Culturas
- Cultura (1:N) Tarefas
- Cultura (1:N) Registos
- Tarefa (1:N) Registos

---

## Índices Recomendados

- farms(profile_id)
- farms(place_id)
- plots(farm_id)
- crops(plot_id)
- cultivation_tasks(crop_id, estado)
- cultivation_log(crop_id)
- cultivation_log(task_id)

---

## Observações

Este módulo suporta o acompanhamento completo do ciclo de cultivo, desde a organização da exploração até ao histórico de operações efetuadas.

---

## Próximo Capítulo

**Capítulo 6 — ERD do Módulo dos Animais**.
