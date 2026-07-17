# ADR-001 --- Escolha do Supabase

## Estado

Aceite

## Data

2026-07-14

## Contexto

O OTJ necessita de uma plataforma backend moderna que forneça
autenticação, base de dados PostgreSQL, armazenamento de ficheiros,
políticas de segurança e APIs, reduzindo a complexidade operacional e
acelerando o desenvolvimento.

## Problema

Selecionar uma plataforma backend que permita:

-   Desenvolvimento rápido.
-   Escalabilidade.
-   Segurança.
-   Custos controlados.
-   Integração simples com o frontend.

## Alternativas Consideradas

### Supabase

-   PostgreSQL nativo.
-   Autenticação integrada.
-   Storage.
-   Row Level Security (RLS).
-   APIs automáticas.

### Firebase

-   Excelente integração com aplicações móveis.
-   Base de dados não relacional como principal opção.

### Backend próprio

-   Maior flexibilidade.
-   Maior custo de desenvolvimento e manutenção.

## Decisão

Adotar o **Supabase** como plataforma backend principal do OTJ.

## Justificação

A escolha do Supabase deve-se à combinação de PostgreSQL, autenticação,
armazenamento, RLS e APIs automáticas, reduzindo significativamente o
esforço de implementação e manutenção.

## Consequências

### Positivas

-   Desenvolvimento mais rápido.
-   PostgreSQL como base relacional.
-   Segurança integrada com RLS.
-   Boa integração com Next.js.
-   Menor carga operacional.

### Negativas

-   Dependência de um fornecedor.
-   Necessidade de acompanhar alterações do serviço.

## Impacto

Afeta diretamente:

-   Base de Dados
-   Backend
-   API
-   Autenticação
-   Storage
-   DevOps
-   Security

## Referências

-   Architecture
-   Backend
-   API
-   Security
-   Operations
-   Product

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ -------------------------------------------
  1.0      2026-07-14   Registo da decisão de adoção do Supabase.
