# ADR-004 --- Modelo RBAC (Role-Based Access Control)

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ possui vários perfis de utilizador (Administrador,
Moderador, Editor, Câmara Municipal, Junta de Freguesia, Associação,
Produtor e Utilizador), cada um com permissões distintas.

## Problema

Definir um modelo de controlo de acessos que seja:

-   Seguro
-   Escalável
-   Simples de administrar
-   Compatível com Supabase e PostgreSQL

## Alternativas Consideradas

### RBAC

-   Permissões atribuídas por papéis.
-   Gestão simples e escalável.

### ABAC

-   Elevada flexibilidade.
-   Maior complexidade de implementação.

### ACL

-   Permissões por utilizador.
-   Difícil manutenção em larga escala.

## Decisão

Adotar o modelo **RBAC (Role-Based Access Control)** como mecanismo
principal de autorização da plataforma.

## Justificação

O RBAC adapta-se ao modelo organizacional do OTJ, simplifica a
administração de permissões e integra-se de forma natural com as
políticas RLS do Supabase.

## Consequências

### Positivas

-   Administração simplificada.
-   Elevada escalabilidade.
-   Permissões consistentes.
-   Boa integração com RLS.

### Negativas

-   Casos muito específicos poderão exigir regras adicionais.
-   Necessidade de rever papéis à medida que a plataforma evolui.

## Impacto

Afeta diretamente:

-   Autenticação
-   Backend
-   API
-   Base de Dados
-   Security
-   Operations

## Referências

-   Security
-   Backend
-   API
-   Product
-   ADR-001
-   ADR-002

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ----------------------------------------------
  1.0      2026-07-14   Registo da decisão de adoção do modelo RBAC.
