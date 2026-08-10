# OTJ — Fase 4
# Capítulo 9 — ERD do Módulo do Marketplace

## Objetivo

Definir o diagrama ERD detalhado do Marketplace do OTJ, suportando lojas, produtos, encomendas, pagamentos e envios.

---

## Diagrama ERD (Mermaid)

```mermaid
erDiagram

    PROFILES ||--o{ STORES : proprietario
    INSTITUTIONS ||--o{ STORES : gere
    PLACES ||--o{ STORES : localiza

    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : subcategoria
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : classifica
    STORES ||--o{ PRODUCTS : vende

    PROFILES ||--o{ ORDERS : compra
    ORDERS ||--o{ ORDER_ITEMS : contem
    PRODUCTS ||--o{ ORDER_ITEMS : incluido

    ORDERS ||--|| PAYMENTS : pagamento
    ORDERS ||--|| SHIPMENTS : envio

    STORES {
        uuid id PK
        uuid owner_id FK
        uuid institution_id FK
        uuid place_id FK
        text nome
        text estado
    }

    PRODUCT_CATEGORIES {
        uuid id PK
        uuid parent_id FK
        text nome
    }

    PRODUCTS {
        uuid id PK
        uuid store_id FK
        uuid category_id FK
        text nome
        numeric preco
        numeric stock
    }

    ORDERS {
        uuid id PK
        uuid buyer_id FK
        text estado
        numeric total
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        numeric quantidade
        numeric preco_unitario
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        text metodo
        text estado
        numeric valor
    }

    SHIPMENTS {
        uuid id PK
        uuid order_id FK
        text transportadora
        text codigo_rastreio
        text estado
    }
```

---

## Cardinalidades

- Perfil (1:N) Lojas
- Instituição (1:N) Lojas
- Loja (1:N) Produtos
- Categoria (1:N) Produtos
- Encomenda (1:N) Itens
- Produto (1:N) Itens da Encomenda
- Encomenda (1:1) Pagamento
- Encomenda (1:1) Envio

---

## Índices Recomendados

- stores(owner_id)
- stores(institution_id)
- products(store_id)
- products(category_id)
- order_items(order_id)
- order_items(product_id)
- payments(order_id)
- shipments(order_id)

---

## Observações

O Marketplace foi concebido para suportar produtores, artesãos, comerciantes e instituições, permitindo futura expansão para faturação, múltiplos vendedores e logística.

---

## Próximo Capítulo

**Capítulo 10 — ERD do Módulo do Turismo**.
