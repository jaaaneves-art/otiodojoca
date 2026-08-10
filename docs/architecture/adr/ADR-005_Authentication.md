# ADR-005 --- Estratégia de Autenticação

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ necessita de um mecanismo de autenticação seguro para
utilizadores individuais, organizações e administradores, garantindo
proteção das contas e integração com o modelo RBAC.

## Problema

Definir uma estratégia de autenticação que ofereça:

-   Segurança elevada
-   Gestão simples de utilizadores
-   Recuperação de conta
-   Integração com Supabase
-   Suporte para autenticação multifator (MFA)

## Alternativas Consideradas

### Supabase Auth

-   Gestão integrada de utilizadores.
-   JWT.
-   MFA.
-   Recuperação de palavra-passe.
-   Boa integração com PostgreSQL e RLS.

### Solução própria

-   Flexibilidade máxima.
-   Maior esforço de desenvolvimento e manutenção.

### Serviço externo dedicado

-   Funcionalidades avançadas.
-   Custos e dependências adicionais.

## Decisão

Adotar o **Supabase Auth** como serviço oficial de autenticação da
plataforma OTJ.

## Justificação

O Supabase Auth integra-se naturalmente com a arquitetura escolhida,
reduz o esforço de implementação, suporta autenticação segura, tokens
JWT, recuperação de conta e autenticação multifator.

## Consequências

### Positivas

-   Implementação rápida.
-   Gestão centralizada das contas.
-   Integração direta com RBAC e RLS.
-   MFA disponível.
-   Menor manutenção.

### Negativas

-   Dependência do serviço Supabase.
-   Necessidade de acompanhar alterações da plataforma.

## Impacto

Afeta diretamente:

-   Autenticação
-   Backend
-   API
-   Base de Dados
-   Security
-   Frontend
-   Operations

## Referências

-   ADR-001
-   ADR-002
-   ADR-004
-   Backend
-   Security
-   Product

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ------------------------------------------------
  1.0      2026-07-14   Registo da estratégia oficial de autenticação.
