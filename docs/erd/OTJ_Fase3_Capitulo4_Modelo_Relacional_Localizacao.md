# OTJ — Fase 3
# Capítulo 4 — Modelo Relacional da Localização

## Objetivo

Definir a estrutura territorial do OTJ. Este módulo será a base comum para todos os restantes, permitindo associar utilizadores, eventos, culturas, animais, alojamentos e outras entidades a uma localização.

---

# Hierarquia Territorial

```text
País
 └── Distrito
      └── Concelho
           └── Freguesia
                └── Lugar / Aldeia
```

---

# 1. countries

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Único |
| codigo_iso | TEXT | ISO 3166 |

---

# 2. districts

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| country_id | UUID | FK → countries.id |
| nome | TEXT | |

Relação:
- countries (1) → (N) districts

---

# 3. municipalities

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| district_id | UUID | FK → districts.id |
| nome | TEXT | |

Relação:
- districts (1) → (N) municipalities

---

# 4. parishes

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| municipality_id | UUID | FK → municipalities.id |
| nome | TEXT | |

Relação:
- municipalities (1) → (N) parishes

---

# 5. places

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| parish_id | UUID | FK → parishes.id |
| nome | TEXT | Lugar, aldeia ou localidade |

Relação:
- parishes (1) → (N) places

---

# Utilização

As restantes tabelas poderão referenciar a localização através da freguesia ou do lugar, conforme o nível de detalhe necessário.

Exemplos:
- profiles → parish_id
- events → place_id
- farms → place_id
- accommodations → place_id

---

## Vantagens

- Estrutura normalizada.
- Evita duplicação de localidades.
- Facilita pesquisas geográficas.
- Permite expansão para outros países.

---

## Próximo Capítulo

**Capítulo 5 — Modelo Relacional da Comunidade**, onde serão definidas as tabelas do fórum, categorias, tópicos, mensagens e comentários.
