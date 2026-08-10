# OTJ-SDR-V01 — SDR-001 a SDR-010

# Standards de Desenvolvimento

---

## SDR-001 — Convenções de Código

**Objetivo**
Definir regras de codificação consistentes para todo o projeto.

**Normas**
- Código legível.
- Nomes descritivos.
- Funções pequenas.
- Comentários apenas quando necessários.

---

## SDR-002 — Git Flow

**Normas**
- main
- develop
- feature/*
- release/*
- hotfix/*

---

## SDR-003 — Estratégia de Branches

Cada funcionalidade deverá ser desenvolvida numa branch própria.

Nunca desenvolver diretamente em main.

---

## SDR-004 — Convenções de Commits

Formato:

tipo(escopo): descrição

Exemplos:

- feat(auth): login Google
- fix(api): corrigido endpoint
- docs(sql): atualizar documentação

---

## SDR-005 — Pull Requests

Obrigatório:

- descrição
- testes
- revisão
- aprovação

---

## SDR-006 — Code Review

Todo o código deverá ser revisto antes da integração.

---

## SDR-007 — Logging

Utilizar logs estruturados.

Nunca registar passwords, tokens ou dados sensíveis.

---

## SDR-008 — Tratamento de Erros

Nunca esconder exceções.

Todas deverão ser registadas e tratadas.

---

## SDR-009 — APIs REST

Normas:

- HTTPS
- JSON
- Versionamento
- Códigos HTTP corretos
- OpenAPI

---

## SDR-010 — Base de Dados

Normas:

- Migrações obrigatórias
- Chaves estrangeiras
- Índices
- UUID
- Auditoria
