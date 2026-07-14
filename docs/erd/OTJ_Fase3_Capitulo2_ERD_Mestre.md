# OTJ — Fase 3
# Capítulo 2 — Desenho do ERD Mestre

## Objetivo

O ERD (Entity Relationship Diagram) representa a estrutura lógica da base de dados do projeto **O Tio do Joca (OTJ)**. Este diagrama servirá de referência para todas as fases de desenvolvimento.

---

## Núcleo Central

```text
Users
   │
Profiles
   │
Roles
   │
Permissions
```

Todo o sistema parte do utilizador autenticado, associado a um perfil e a um conjunto de permissões.

---

## Módulos Principais

```text
                 Localização
                      │
 ┌──────────────┬─────┼─────┬──────────────┐
 │              │     │     │              │
Comunidade Agricultura Animais Turismo Agenda
 │              │      │      │       │
Marketplace Biblioteca Notificações Administração
```

A entidade **Localização** funciona como elo comum para os módulos que dependem do território (distrito, concelho, freguesia e lugar).

---

## Relações de Alto Nível

- Utilizador → Perfil (1:1)
- Perfil → Papéis (N:N)
- Papéis → Permissões (N:N)
- Utilizador → Tópicos (1:N)
- Tópico → Mensagens (1:N)
- Mensagem → Comentários (1:N)
- Cultura → Tarefas (1:N)
- Animal → Plano Sanitário (1:N)
- Evento → Localização (N:1)
- Produto → Loja (N:1)
- Encomenda → Produtos (N:N)
- Artigo → Categoria (N:1)
- Notificação → Utilizador (N:1)

---

## Princípios do Modelo

- Modular.
- Escalável.
- Normalizado.
- Preparado para PostgreSQL/Supabase.
- Compatível com RLS.
- Preparado para futuras expansões.

---

## Próximo Capítulo

**Capítulo 3 — Modelo Relacional Inicial**, onde serão definidas as primeiras tabelas, respetivas chaves primárias, chaves estrangeiras e relações.
