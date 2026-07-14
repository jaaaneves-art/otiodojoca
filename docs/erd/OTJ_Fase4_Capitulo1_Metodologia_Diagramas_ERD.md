# OTJ — Fase 4
# Capítulo 1 — Metodologia dos Diagramas ERD

## Objetivo

Definir a metodologia que será utilizada para construir todos os Diagramas Entidade-Relacionamento (ERD) da plataforma **O Tio do Joca (OTJ)**.

Esta fase transforma o modelo relacional da Fase 3 em diagramas visuais completos, prontos para implementação em PostgreSQL/Supabase.

---

# Convenções

## Entidades

Cada tabela será representada por uma entidade.

Exemplo:

```text
+------------------+
| profiles         |
+------------------+
| PK id            |
| user_id (FK)     |
| nome             |
| avatar           |
| created_at       |
+------------------+
```

---

## Chaves

- **PK** — Chave Primária
- **FK** — Chave Estrangeira
- **UK** — Chave Única

---

## Cardinalidades

Serão utilizadas as seguintes relações:

- 1 : 1
- 1 : N
- N : N

Exemplo:

```text
users
 1
 │
 │
 N
profiles
```

---

## Regras

Cada diagrama incluirá:

- Nome da tabela
- Todos os campos
- Tipo de dados
- PK
- FK
- Restrições de unicidade
- Relações
- Cardinalidades
- Índices recomendados

---

## Organização

Será criado um diagrama independente para cada módulo:

1. Autenticação
2. Localização
3. Comunidade
4. Agricultura
5. Animais
6. Agenda e Eventos
7. Entidades Institucionais
8. Marketplace
9. Turismo
10. Biblioteca
11. Notificações
12. Administração

No final será produzido um **ERD Global** que unificará todos os módulos.

---

## Próximo Capítulo

**Capítulo 2 — ERD do Núcleo de Autenticação**, com o primeiro diagrama detalhado do sistema.
