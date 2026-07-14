# OTJ — Fase 3
# Capítulo 9 — Modelo Relacional das Entidades Institucionais

## Objetivo

Definir o modelo relacional das entidades institucionais da plataforma OTJ, permitindo gerir organismos oficiais e associações com perfis próprios, permissões específicas e ligação ao território.

---

# Estrutura Geral

```text
Tipo de Entidade
        │
Entidade
        │
Representantes
        │
Eventos
        │
Publicações
```

---

# 1. institution_types

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| descricao | TEXT | Opcional |

Exemplos:
- Câmara Municipal
- Junta de Freguesia
- Cooperativa
- Associação
- Casa do Povo
- Rancho Folclórico

---

# 2. institutions

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| institution_type_id | UUID | FK → institution_types.id |
| place_id | UUID | FK → places.id |
| nome | TEXT | |
| descricao | TEXT | |
| email | TEXT | |
| telefone | TEXT | |
| website | TEXT | Opcional |
| estado | TEXT | Ativa/Inativa |

Relação:
- institution_types (1) → (N) institutions

---

# 3. institution_members

| Campo | Tipo |
|-------|------|
| id | UUID |
| institution_id | UUID |
| profile_id | UUID |
| funcao | TEXT |
| data_inicio | DATE |
| data_fim | DATE |

Exemplos:
- Presidente
- Secretário
- Tesoureiro
- Gestor de Conteúdo

---

# 4. institution_posts

| Campo | Tipo |
|-------|------|
| id | UUID |
| institution_id | UUID |
| autor_id | UUID |
| titulo | TEXT |
| conteudo | TEXT |
| publicado_em | TIMESTAMP |

---

# Relações Principais

- Tipo de Entidade → Entidades (1:N)
- Entidade → Representantes (1:N)
- Perfil → Representações (1:N)
- Entidade → Publicações (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Verificação institucional
- Gestão documental
- Área privada
- Gestão de equipas
- Estatísticas
- Integração com eventos e marketplace

---

## Próximo Capítulo

**Capítulo 10 — Modelo Relacional do Marketplace**, dedicado a lojas, produtos, encomendas, pagamentos e envios.
