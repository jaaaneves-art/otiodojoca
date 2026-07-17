# ADR-008 --- Estratégia de Backups

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ armazena dados críticos, incluindo utilizadores,
conteúdos, eventos, marketplace e configurações. É essencial definir uma
estratégia de backups que assegure a recuperação da informação em caso
de falha.

## Problema

Definir uma política de cópias de segurança que garanta:

-   Proteção dos dados
-   Recuperação rápida
-   Retenção adequada
-   Testes periódicos de restauro
-   Continuidade do serviço

## Alternativas Consideradas

### Backups automáticos

-   Execução programada.
-   Menor risco de falha humana.
-   Melhor integração com a infraestrutura.

### Backups manuais

-   Simples de implementar.
-   Elevado risco de esquecimento e inconsistência.

## Decisão

Adotar uma estratégia de **backups automáticos**, complementada por
testes regulares de restauro e documentação dos procedimentos de
recuperação.

## Justificação

A automatização reduz o risco operacional e garante que existem cópias
atualizadas e consistentes, essenciais para a continuidade do serviço.

## Consequências

### Positivas

-   Maior proteção dos dados.
-   Recuperação mais rápida.
-   Redução do risco de perda de informação.
-   Conformidade com boas práticas operacionais.

### Negativas

-   Consumo adicional de armazenamento.
-   Necessidade de monitorização e testes periódicos.

## Impacto

Afeta diretamente:

-   Base de Dados
-   Infrastructure
-   DevOps
-   Operations
-   Security

## Referências

-   Infrastructure
-   Operations
-   Security
-   Guides
-   ADR-001
-   ADR-002
-   ADR-007

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ -------------------------------------------
  1.0      2026-07-14   Registo da estratégia oficial de backups.
