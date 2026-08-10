# OTJ — Fase 3
# Capítulo 6 — Modelo Relacional da Agricultura

## Objetivo

Definir a estrutura da base de dados do módulo de Agricultura, permitindo acompanhar culturas, tarefas, calendários, parcelas e o diário agrícola.

---

# Estrutura Geral

```text
Exploração
    │
Parcela
    │
Cultura
    │
Plano de Cultivo
    │
Tarefa
    │
Registo
```

---

# 1. farms

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| profile_id | UUID | FK → profiles.id |
| place_id | UUID | FK → places.id |
| nome | TEXT | Nome da exploração |
| descricao | TEXT | Opcional |

Relação:
- profiles (1) → (N) farms

---

# 2. plots

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| farm_id | UUID | FK → farms.id |
| nome | TEXT | Identificação |
| area | NUMERIC | Área |
| unidade | TEXT | m², ha, etc. |

Relação:
- farms (1) → (N) plots

---

# 3. crops

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| plot_id | UUID | FK → plots.id |
| especie | TEXT | |
| variedade | TEXT | |
| data_inicio | DATE | |
| estado | TEXT | |

Relação:
- plots (1) → (N) crops

---

# 4. cultivation_tasks

| Campo | Tipo |
|-------|------|
| id | UUID |
| crop_id | UUID |
| tipo | TEXT |
| data_prevista | DATE |
| data_execucao | DATE |
| estado | TEXT |

Exemplos:
- Sementeira
- Plantação
- Rega
- Adubação
- Tratamento
- Colheita

---

# 5. cultivation_log

| Campo | Tipo |
|-------|------|
| id | UUID |
| crop_id | UUID |
| task_id | UUID |
| observacoes | TEXT |
| fotografias | INTEGER |
| criado_em | TIMESTAMP |

---

# Relações Principais

- Exploração → Parcelas (1:N)
- Parcela → Culturas (1:N)
- Cultura → Tarefas (1:N)
- Cultura → Diário (1:N)

---

## Evolução Futura

Este módulo poderá incluir:
- Alertas automáticos
- Calendário agrícola
- Condições meteorológicas
- Doenças e pragas
- Produção e colheitas
- Custos e rentabilidade
- Integração com IA para recomendações

---

## Próximo Capítulo

**Capítulo 7 — Modelo Relacional dos Animais**, dedicado à gestão de animais, raças, sanidade, reprodução e produção.
