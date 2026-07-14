# OTJ — Fase 3
# Capítulo 7 — Modelo Relacional dos Animais

## Objetivo

Definir a estrutura da base de dados para a gestão de animais da plataforma OTJ, abrangendo animais de produção, animais domésticos, aves e outras espécies.

---

# Estrutura Geral

```text
Espécie
    │
Raça
    │
Animal
    │
Plano Sanitário
    │
Vacinas / Tratamentos
    │
Reprodução
    │
Produção
```

---

# 1. species

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| nome | TEXT | Nome da espécie |
| categoria | TEXT | Bovino, Ovino, Caprino, Suíno, Aves, Equinos, Cães, Gatos, etc. |

---

# 2. breeds

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| species_id | UUID | FK → species.id |
| nome | TEXT | Nome da raça |

Relação:
- species (1) → (N) breeds

---

# 3. animals

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| breed_id | UUID | FK → breeds.id |
| owner_id | UUID | FK → profiles.id |
| identificacao | TEXT | Brinco, chip ou outro identificador |
| nome | TEXT | Opcional |
| sexo | TEXT | |
| data_nascimento | DATE | |
| estado | TEXT | Ativo, vendido, falecido, etc. |

Relação:
- breeds (1) → (N) animals
- profiles (1) → (N) animals

---

# 4. health_records

| Campo | Tipo |
|-------|------|
| id | UUID |
| animal_id | UUID |
| tipo | TEXT |
| data | DATE |
| observacoes | TEXT |

Exemplos:
- Vacinação
- Desparasitação
- Consulta
- Tratamento

---

# 5. reproduction

| Campo | Tipo |
|-------|------|
| id | UUID |
| animal_id | UUID |
| data | DATE |
| evento | TEXT |
| observacoes | TEXT |

---

# 6. production_records

| Campo | Tipo |
|-------|------|
| id | UUID |
| animal_id | UUID |
| tipo | TEXT |
| quantidade | NUMERIC |
| data | DATE |

Exemplos:
- Leite
- Ovos
- Lã
- Mel

---

# Relações Principais

- Espécie → Raças (1:N)
- Raça → Animais (1:N)
- Animal → Registos Sanitários (1:N)
- Animal → Reprodução (1:N)
- Animal → Produção (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Pedigree
- Genealogia
- Alertas sanitários
- Calendário de vacinas
- Controlo de alimentação
- Custos por animal
- Integração com identificação eletrónica

---

## Próximo Capítulo

**Capítulo 8 — Modelo Relacional da Agenda e Eventos**, dedicado a feiras, festas, romarias, mercados e restantes eventos da plataforma.
