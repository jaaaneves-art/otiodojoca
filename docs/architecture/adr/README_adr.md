# Architecture Decision Records (ADR)

Esta pasta contém os **Architecture Decision Records (ADR)** do projeto
OTJ.

## Objetivo

Cada ADR documenta uma decisão técnica importante, incluindo:

-   contexto;
-   problema;
-   alternativas consideradas;
-   decisão tomada;
-   justificação;
-   consequências.

## Estrutura

``` text
ADR-000_Template.md
ADR-001_...
ADR-002_...
...
```

## Organização

-   ADR-000 é o modelo oficial.
-   ADR-001 em diante correspondem às decisões efetivamente adotadas.
-   O ficheiro **OTJ-ADR-INDEX.md** contém o índice geral.
-   Os ficheiros **OTJ-ADR-Vxx** agrupam os ADR por coleção.

## Regra

Uma decisão arquitetural nunca deve ser alterada retroativamente.

Caso uma decisão mude, deve ser criado um novo ADR referenciando o
anterior.
