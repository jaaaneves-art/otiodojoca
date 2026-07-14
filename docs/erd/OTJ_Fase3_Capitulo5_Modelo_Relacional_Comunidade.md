# OTJ — Fase 3
# Capítulo 5 — Modelo Relacional da Comunidade

## Objetivo

Definir o modelo relacional do módulo da Comunidade, responsável pelo fórum, discussões, partilha de conhecimento e interação entre os utilizadores.

---

# Estrutura Geral

```text
Categoria
    │
Subcategoria
    │
Tópico
    │
Mensagem
    │
Comentário
```

---

# 1. categories

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| parent_id | UUID | FK → categories.id (opcional) |
| nome | TEXT | Nome da categoria |
| descricao | TEXT | Descrição |
| ordem | INTEGER | Ordenação |

Relação:
- categories (1) → (N) categories (hierarquia)

---

# 2. threads

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| category_id | UUID | FK → categories.id |
| author_id | UUID | FK → profiles.id |
| titulo | TEXT | |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | |

Relação:
- categories (1) → (N) threads
- profiles (1) → (N) threads

---

# 3. posts

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| thread_id | UUID | FK → threads.id |
| author_id | UUID | FK → profiles.id |
| conteudo | TEXT | |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | |

Relação:
- threads (1) → (N) posts
- profiles (1) → (N) posts

---

# 4. post_reactions

| Campo | Tipo |
|-------|------|
| id | UUID |
| post_id | UUID |
| profile_id | UUID |
| tipo | TEXT |

Exemplos de tipo:
- gosto
- útil
- obrigado

---

# 5. attachments

| Campo | Tipo |
|-------|------|
| id | UUID |
| post_id | UUID |
| ficheiro | TEXT |
| tipo | TEXT |

---

# Relações Principais

- Categoria → Tópicos (1:N)
- Tópico → Mensagens (1:N)
- Mensagem → Anexos (1:N)
- Mensagem → Reações (1:N)
- Perfil → Mensagens (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Menções (@utilizador)
- Etiquetas (tags)
- Conteúdo destacado
- Moderação
- Histórico de edições
- Sistema de reputação

---

## Próximo Capítulo

**Capítulo 6 — Modelo Relacional da Agricultura**, onde será estruturado o módulo de culturas, tarefas, calendários e acompanhamento agrícola.
