# ADR-002 --- Escolha do PostgreSQL

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ necessita de uma base de dados relacional robusta para
suportar utilizadores, organizações, conteúdos, eventos, marketplace,
permissões e auditoria.

## Problema

Selecionar um sistema de gestão de base de dados que assegure:

-   Integridade dos dados
-   Escalabilidade
-   Elevado desempenho
-   Compatibilidade com o ecossistema escolhido
-   Funcionalidades avançadas de segurança

## Alternativas Consideradas

### PostgreSQL

-   Base de dados relacional madura.
-   Elevada conformidade com SQL.
-   Extensível.
-   Excelente integração com o Supabase.

### MySQL

-   Ampla adoção.
-   Menor flexibilidade para algumas funcionalidades avançadas.

### MongoDB

-   Base de dados documental.
-   Menor adequação ao modelo relacional do OTJ.

## Decisão

Adotar o **PostgreSQL** como sistema oficial de gestão da base de dados
da plataforma.

## Justificação

O modelo de dados do OTJ é fortemente relacional e beneficia das
funcionalidades do PostgreSQL, incluindo integridade referencial,
transações ACID, índices avançados, JSONB, extensões e excelente
desempenho.

## Consequências

### Positivas

-   Elevada fiabilidade.
-   Excelente integração com Supabase.
-   Forte suporte a consultas complexas.
-   Escalabilidade.
-   Comunidade ativa.

### Negativas

-   Curva de aprendizagem superior a soluções mais simples.
-   Necessidade de otimização em bases de dados de grande dimensão.

## Impacto

Afeta diretamente:

-   Modelo ERD
-   SQL
-   Backend
-   API
-   Segurança
-   DevOps

## Referências

-   Architecture
-   ERD
-   SQL
-   Backend
-   API
-   ADR-001

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ---------------------------------------------
  1.0      2026-07-14   Registo da decisão de adoção do PostgreSQL.
