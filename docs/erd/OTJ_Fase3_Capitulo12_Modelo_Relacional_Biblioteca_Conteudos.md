# OTJ — Fase 3
# Capítulo 12 — Modelo Relacional da Biblioteca e Conteúdos

## Objetivo

Definir o modelo relacional do módulo da Biblioteca e Conteúdos, responsável por organizar todo o conhecimento disponibilizado na plataforma OTJ.

---

# Estrutura Geral

```text
Categoria
    │
Artigo
    │
Documentos
    │
Vídeos
    │
Anexos
```

---

# 1. content_categories

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| parent_id | UUID | FK → content_categories.id (opcional) |
| nome | TEXT | Único |
| descricao | TEXT | Opcional |

---

# 2. articles

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| category_id | UUID | FK → content_categories.id |
| author_id | UUID | FK → profiles.id |
| titulo | TEXT | |
| resumo | TEXT | |
| conteudo | TEXT | |
| publicado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | |

---

# 3. documents

| Campo | Tipo |
|-------|------|
| id | UUID |
| article_id | UUID |
| titulo | TEXT |
| ficheiro | TEXT |
| formato | TEXT |

Exemplos de formato:
- PDF
- DOCX
- XLSX
- ODT

---

# 4. videos

| Campo | Tipo |
|-------|------|
| id | UUID |
| article_id | UUID |
| titulo | TEXT |
| url | TEXT |
| duracao | INTEGER |

---

# 5. attachments

| Campo | Tipo |
|-------|------|
| id | UUID |
| article_id | UUID |
| ficheiro | TEXT |
| legenda | TEXT |

---

# Relações Principais

- Categoria → Artigos (1:N)
- Artigo → Documentos (1:N)
- Artigo → Vídeos (1:N)
- Artigo → Anexos (1:N)
- Perfil → Artigos (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Controlo de versões
- Pesquisa avançada
- Etiquetas (tags)
- Conteúdos relacionados
- Favoritos
- Histórico de leitura
- Conteúdo gerado por IA

---

## Próximo Capítulo

**Capítulo 13 — Modelo Relacional das Notificações**, dedicado a alertas, mensagens, emails e notificações push.
