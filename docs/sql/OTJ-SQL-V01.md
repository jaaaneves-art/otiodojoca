# OTJ-SQL-V01 — Estrutura Base

## Objetivo

Este documento define a estrutura base da Base de Dados do projeto **O Tio do Joca (OTJ)**.

Constitui a fundação sobre a qual assentam todos os restantes módulos da plataforma, estabelecendo os princípios de organização, nomenclatura e implementação da base de dados.

---

# Sistema de Gestão de Base de Dados

A plataforma OTJ utiliza:

- PostgreSQL
- Supabase como plataforma de alojamento e gestão
- SQL padrão compatível com PostgreSQL

---

# Princípios Gerais

A Base de Dados deverá ser:

- Modular
- Escalável
- Segura
- Normalizada
- Fácil de manter
- Preparada para expansão futura

---

# Organização

A informação encontra-se organizada por módulos funcionais, refletindo a arquitetura da plataforma.

Cada módulo é implementado através de tabelas relacionadas entre si por chaves estrangeiras, garantindo a integridade referencial.

---

# Convenções de Nomenclatura

## Tabelas

- Nomes em minúsculas
- Utilização de underscore (`_`) para separar palavras
- Preferência pelo plural

Exemplos:

- users
- user_profiles
- municipalities
- events
- forum_posts

---

## Colunas

- Minúsculas
- Snake_case
- Nomes claros e consistentes

Exemplos:

- created_at
- updated_at
- published_at
- municipality_id
- category_id

---

## Chaves Primárias

Todas as tabelas possuem uma chave primária denominada:

id

Tipo recomendado:

UUID

---

## Chaves Estrangeiras

As chaves estrangeiras seguem a convenção:

nome_da_tabela_id

Exemplos:

- user_id
- parish_id
- event_id
- article_id

---

## Datas

Sempre que aplicável, as tabelas incluem:

- created_at
- updated_at

Podem ainda incluir:

- deleted_at
- published_at
- approved_at

---

# Integridade

Toda a estrutura deverá garantir:

- Integridade referencial
- Consistência dos dados
- Restrições adequadas
- Validação através de constraints

---

# Escalabilidade

A arquitetura deverá permitir:

- Adição de novos módulos
- Novas funcionalidades
- Novas entidades
- Novos relacionamentos

Sem necessidade de alterações estruturais significativas.

---

# Compatibilidade

Toda a implementação deverá ser compatível com:

- PostgreSQL
- Supabase
- Ferramentas ORM compatíveis com PostgreSQL
- Migrações automáticas

---

# Conclusão

Esta estrutura base estabelece as normas fundamentais para toda a implementação SQL do projeto OTJ, garantindo consistência, qualidade, segurança e facilidade de evolução da Base de Dados.