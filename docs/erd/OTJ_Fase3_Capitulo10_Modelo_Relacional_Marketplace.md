# OTJ — Fase 3
# Capítulo 10 — Modelo Relacional do Marketplace

## Objetivo

Definir a estrutura da base de dados do Marketplace do OTJ, permitindo a venda de produtos, gestão de lojas, encomendas, pagamentos e envios.

---

# Estrutura Geral

```text
Loja
   │
Categorias
   │
Produtos
   │
Encomendas
   │
Pagamentos
   │
Envios
```

---

# 1. stores

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| owner_id | UUID | FK → profiles.id |
| institution_id | UUID | FK → institutions.id (opcional) |
| nome | TEXT | |
| descricao | TEXT | |
| place_id | UUID | FK → places.id |
| estado | TEXT | Ativa, Suspensa, Encerrada |

---

# 2. product_categories

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| parent_id | UUID | FK → product_categories.id (opcional) |
| nome | TEXT | |
| descricao | TEXT | |

---

# 3. products

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | UUID | PK |
| store_id | UUID | FK → stores.id |
| category_id | UUID | FK → product_categories.id |
| nome | TEXT | |
| descricao | TEXT | |
| preco | NUMERIC | |
| stock | NUMERIC | |
| unidade | TEXT | kg, un., L, etc. |
| ativo | BOOLEAN | |

---

# 4. orders

| Campo | Tipo |
|-------|------|
| id | UUID |
| buyer_id | UUID |
| estado | TEXT |
| total | NUMERIC |
| criado_em | TIMESTAMP |

---

# 5. order_items

| Campo | Tipo |
|-------|------|
| id | UUID |
| order_id | UUID |
| product_id | UUID |
| quantidade | NUMERIC |
| preco_unitario | NUMERIC |

---

# 6. payments

| Campo | Tipo |
|-------|------|
| id | UUID |
| order_id | UUID |
| metodo | TEXT |
| estado | TEXT |
| valor | NUMERIC |
| pago_em | TIMESTAMP |

---

# 7. shipments

| Campo | Tipo |
|-------|------|
| id | UUID |
| order_id | UUID |
| transportadora | TEXT |
| codigo_rastreio | TEXT |
| estado | TEXT |
| enviado_em | TIMESTAMP |

---

# Relações Principais

- Loja → Produtos (1:N)
- Categoria → Produtos (1:N)
- Encomenda → Itens (1:N)
- Produto → Itens da Encomenda (1:N)
- Encomenda → Pagamento (1:1)
- Encomenda → Envio (1:1)

---

## Evolução Futura

Este módulo poderá incluir:
- Cupões de desconto
- Promoções
- Avaliações de produtos
- Lista de desejos
- Múltiplos vendedores por encomenda
- Faturação eletrónica
- Integração com transportadoras

---

## Próximo Capítulo

**Capítulo 11 — Modelo Relacional do Turismo**, dedicado a alojamentos, restaurantes, pontos de interesse, trilhos e experiências.
