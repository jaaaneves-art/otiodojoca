# OTJ — Fase 5
# Capítulo 1 — Estratégia de Implementação Física da Base de Dados

## Objetivo

Definir a estratégia para converter o modelo lógico e os diagramas ERD da plataforma **O Tio do Joca (OTJ)** numa implementação física em PostgreSQL/Supabase.

---

## Princípios

- PostgreSQL como motor de base de dados.
- Compatibilidade total com Supabase.
- Utilização de UUID como chave primária.
- Integridade referencial através de chaves estrangeiras.
- Estrutura normalizada.
- Preparada para crescimento modular.

---

## Ordem de Implementação

1. Extensões PostgreSQL
2. Esquema da base de dados
3. Tabelas nucleares
4. Tabelas de localização
5. Restantes módulos
6. Índices
7. Constraints
8. Views
9. Funções
10. Triggers
11. Políticas RLS
12. Dados iniciais (seed)

---

## Convenções

### Chaves Primárias
- UUID
- `gen_random_uuid()`

### Auditoria

Todas as tabelas deverão incluir, sempre que aplicável:

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

### Nomenclatura

- Tabelas em inglês
- `snake_case`
- Chaves estrangeiras terminadas em `_id`

---

## Estrutura de Migrações

```text
sql/
├── 001_extensions.sql
├── 002_auth.sql
├── 003_location.sql
├── 004_community.sql
├── 005_agriculture.sql
├── 006_animals.sql
├── 007_events.sql
├── 008_institutions.sql
├── 009_marketplace.sql
├── 010_tourism.sql
├── 011_library.sql
├── 012_notifications.sql
├── 013_admin.sql
├── 014_indexes.sql
├── 015_rls.sql
└── 016_seed.sql
```

---

## Resultado Esperado

No final da Fase 5 existirá um conjunto de scripts SQL versionados, prontos para execução no Supabase e para integração contínua.

---

## Próximo Capítulo

**Capítulo 2 — Extensões PostgreSQL e Estrutura Base da Base de Dados**.
