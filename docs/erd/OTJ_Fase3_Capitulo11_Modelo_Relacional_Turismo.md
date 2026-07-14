# OTJ — Fase 3
# Capítulo 11 — Modelo Relacional do Turismo

## Objetivo

Definir o modelo relacional do módulo de Turismo da plataforma OTJ, permitindo divulgar e gerir alojamentos, restaurantes, pontos de interesse, trilhos, rotas e experiências locais.

---

# Estrutura Geral

```text
Categoria
    │
Local Turístico
    │
Alojamento / Restaurante / Ponto de Interesse
    │
Trilhos e Rotas
    │
Experiências
```

---

# 1. tourism_categories

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| descricao | TEXT | Opcional |

Exemplos:
- Alojamento
- Restaurante
- Museu
- Praia Fluvial
- Trilho
- Monumento

---

# 2. tourism_places

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| category_id | UUID | FK → tourism_categories.id |
| place_id | UUID | FK → places.id |
| nome | TEXT | |
| descricao | TEXT | |
| morada | TEXT | |
| telefone | TEXT | Opcional |
| email | TEXT | Opcional |
| website | TEXT | Opcional |
| estado | TEXT | Ativo/Inativo |

---

# 3. trails

| Campo | Tipo |
|-------|------|
| id | UUID |
| nome | TEXT |
| origem_place_id | UUID |
| destino_place_id | UUID |
| distancia_km | NUMERIC |
| dificuldade | TEXT |

---

# 4. experiences

| Campo | Tipo |
|-------|------|
| id | UUID |
| tourism_place_id | UUID |
| titulo | TEXT |
| descricao | TEXT |
| duracao | TEXT |
| preco | NUMERIC |

---

# 5. tourism_images

| Campo | Tipo |
|-------|------|
| id | UUID |
| tourism_place_id | UUID |
| ficheiro | TEXT |
| legenda | TEXT |

---

# Relações Principais

- Categoria → Locais Turísticos (1:N)
- Local Turístico → Imagens (1:N)
- Local Turístico → Experiências (1:N)
- Lugar → Locais Turísticos (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Reservas online
- Avaliações
- Favoritos
- Guias locais
- Calendário de visitas
- Integração com mapas
- Rotas personalizadas

---

## Próximo Capítulo

**Capítulo 12 — Modelo Relacional da Biblioteca e Conteúdos**, dedicado a artigos, guias, documentos, vídeos e restantes conteúdos da plataforma.
