# ADR-009 --- Logging e Monitorização

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ necessita de mecanismos de registo de eventos e
monitorização para garantir disponibilidade, facilitar o diagnóstico de
problemas, apoiar auditorias e reforçar a segurança.

## Problema

Definir uma estratégia que assegure:

-   Registo consistente de eventos
-   Monitorização contínua
-   Alertas automáticos
-   Auditoria
-   Apoio à resolução de incidentes

## Alternativas Consideradas

### Logging e monitorização centralizados

-   Consolidação dos registos.
-   Maior visibilidade operacional.
-   Integração com alertas.

### Registos locais isolados

-   Implementação simples.
-   Difícil análise e correlação de eventos.

## Decisão

Adotar uma estratégia de **logging e monitorização centralizados**, com
métricas, auditoria e alertas para eventos críticos.

## Justificação

A centralização melhora a observabilidade da plataforma, acelera o
diagnóstico de falhas e apoia a segurança e a operação contínua.

## Consequências

### Positivas

-   Deteção rápida de incidentes.
-   Melhor capacidade de diagnóstico.
-   Auditoria consistente.
-   Apoio à operação e manutenção.

### Negativas

-   Necessidade de infraestrutura adicional.
-   Custos de armazenamento dos registos.
-   Definição de políticas de retenção.

## Impacto

Afeta diretamente:

-   Infrastructure
-   DevOps
-   Security
-   Operations
-   Backend
-   API

## Referências

-   Infrastructure
-   Operations
-   Security
-   DevOps
-   ADR-007
-   ADR-008

## Histórico de Revisões

  ------------------------------------------------------------------------
  Versão                 Data              Alteração
  ---------------------- ----------------- -------------------------------
  1.0                    2026-07-14        Registo da estratégia oficial
                                           de logging e monitorização.

  ------------------------------------------------------------------------
