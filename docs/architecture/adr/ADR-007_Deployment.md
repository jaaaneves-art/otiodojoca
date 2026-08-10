# ADR-007 --- Estratégia de Deploy

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ será disponibilizada em diferentes ambientes
(Desenvolvimento, Testes e Produção). É necessário definir uma
estratégia de deploy consistente, segura e repetível.

## Problema

Definir um processo de deploy que garanta:

-   Automatização
-   Rastreabilidade
-   Reversão (rollback)
-   Disponibilidade
-   Baixo risco durante as atualizações

## Alternativas Consideradas

### CI/CD Automatizado

-   Publicação automática após validações.
-   Maior consistência.
-   Menor intervenção manual.

### Deploy Manual

-   Simples de iniciar.
-   Mais suscetível a erros humanos.

## Decisão

Adotar uma estratégia baseada em **CI/CD**, com pipelines para
validação, testes e publicação, diferenciando os ambientes de
Desenvolvimento, Testes e Produção.

## Justificação

A automatização reduz erros, acelera as entregas, melhora a qualidade
das publicações e facilita a implementação de rollback quando
necessário.

## Consequências

### Positivas

-   Deploy repetível.
-   Maior fiabilidade.
-   Integração com testes automáticos.
-   Publicações mais rápidas.
-   Facilidade de rollback.

### Negativas

-   Maior esforço inicial de configuração.
-   Necessidade de manutenção das pipelines.

## Impacto

Afeta diretamente:

-   DevOps
-   Backend
-   Frontend
-   QA
-   Infrastructure
-   Operations

## Referências

-   DevOps
-   Infrastructure
-   Guides
-   QA
-   ADR-003
-   ADR-006

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ------------------------------------------
  1.0      2026-07-14   Registo da estratégia oficial de deploy.
