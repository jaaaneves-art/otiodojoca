# ADR-006 --- Estrutura do Repositório

## Estado

Aceite

## Data

2026-07-14

## Contexto

O projeto OTJ reúne código-fonte, documentação, testes e recursos
diversos. É necessária uma estrutura de repositório consistente para
facilitar a manutenção, colaboração e evolução do projeto.

## Problema

Definir uma organização do repositório que seja:

-   Clara
-   Escalável
-   Fácil de navegar
-   Adequada ao desenvolvimento colaborativo

## Alternativas Consideradas

### Estrutura modular por domínio

-   Documentação separada por coleções.
-   Código organizado por responsabilidades.
-   Boa escalabilidade.

### Estrutura plana

-   Simples no início.
-   Difícil de manter à medida que o projeto cresce.

## Decisão

Adotar uma estrutura modular, separando documentação, código, testes e
recursos em pastas específicas.

## Estrutura Principal

``` text
docs/
src/
public/
tests/
scripts/
```

## Justificação

Esta organização reduz a complexidade, facilita a localização dos
ficheiros e permite que a documentação evolua em paralelo com o código.

## Consequências

### Positivas

-   Organização consistente.
-   Facilidade de manutenção.
-   Melhor integração de novos colaboradores.
-   Escalabilidade.

### Negativas

-   Exige disciplina para manter a estrutura.
-   Pequena curva de aprendizagem para novos membros.

## Impacto

Afeta diretamente:

-   Arquitetura
-   Backend
-   Frontend
-   DevOps
-   QA
-   Documentação

## Referências

-   Architecture
-   Backend
-   Frontend
-   DevOps
-   Documentation Standards
-   ADR-003

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ----------------------------------------------
  1.0      2026-07-14   Registo da estrutura oficial do repositório.
