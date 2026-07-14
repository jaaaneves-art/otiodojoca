# OTJ — SQL: Implementação da Base de Dados

## Objetivo

Esta fase destina-se à implementação física da Base de Dados do projeto **O Tio do Joca (OTJ)** utilizando PostgreSQL (Supabase), transformando o modelo conceptual e os Diagramas Entidade-Relacionamento (ERD) numa estrutura SQL completa, consistente, segura e preparada para evolução futura.

---

# Âmbito

Esta documentação inclui:

- Criação da Base de Dados
- Estrutura de Schemas
- Tabelas
- Chaves Primárias (Primary Keys)
- Chaves Estrangeiras (Foreign Keys)
- Constraints
- Índices
- Views
- Funções SQL
- Stored Procedures
- Triggers
- Políticas de Segurança (Row Level Security)
- Roles e Permissões
- Dados iniciais (Seed Data)
- Migrações
- Versionamento da Base de Dados
- Otimização de desempenho
- Estratégias de Backup e Recuperação

---

# Objetivos Técnicos

A implementação deverá garantir:

- Integridade dos dados
- Elevada performance
- Escalabilidade
- Segurança
- Facilidade de manutenção
- Compatibilidade com Supabase
- Compatibilidade com PostgreSQL

---

# Organização da documentação

A implementação SQL será dividida por módulos, acompanhando a arquitetura definida anteriormente.

Exemplo:

- SQL-001 — Estrutura Base
- SQL-002 — Utilizadores
- SQL-003 — Perfis
- SQL-004 — Localizações
- SQL-005 — Taxonomias
- SQL-006 — Agricultura
- SQL-007 — Pecuária
- SQL-008 — Mercado
- SQL-009 — Fórum
- SQL-010 — Eventos
- SQL-011 — Media
- SQL-012 — Segurança
- SQL-013 — RLS
- SQL-014 — Índices
- SQL-015 — Views
- SQL-016 — Triggers
- SQL-017 — Seeds
- SQL-018 — Migrações

---

# Resultado esperado

No final desta fase existirá uma Base de Dados totalmente implementada, documentada e pronta para ser utilizada pela plataforma OTJ.