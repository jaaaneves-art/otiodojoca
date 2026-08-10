# OTJ-DATA-001 --- Modelo de Dados Completo

# Capítulo 2 --- Princípios do Modelo de Dados

## 2.1 Finalidade

Este capítulo define os princípios que orientam a conceção, organização
e evolução do modelo de dados do Projeto O Tio do Joca. Estes princípios
garantem consistência, reutilização da informação e independência
relativamente às tecnologias de implementação.

## 2.2 Objetivos

O modelo de dados deverá:

-   representar corretamente o domínio do projeto;
-   evitar redundâncias desnecessárias;
-   promover a reutilização da informação;
-   facilitar a evolução do sistema;
-   assegurar integridade e qualidade dos dados.

## 2.3 Princípios Fundamentais

O modelo deverá respeitar os seguintes princípios:

-   unicidade da informação;
-   normalização adequada;
-   integridade referencial;
-   rastreabilidade;
-   escalabilidade;
-   interoperabilidade.

## 2.4 Identificação

Cada entidade deverá possuir um identificador único, permanente e
independente da interface de utilizador, permitindo referências
consistentes entre módulos.

## 2.5 Reutilização

Sempre que possível, a mesma informação deverá ser reutilizada por
diferentes módulos, evitando duplicação e reduzindo inconsistências.

## 2.6 Evolução

O modelo deverá permitir a introdução de novas entidades, atributos e
relações através de migrações controladas, preservando a compatibilidade
com os dados existentes.

## 2.7 Síntese

Os princípios definidos neste capítulo constituem a base para todas as
entidades, relações e regras de integridade descritas nos capítulos
seguintes.

------------------------------------------------------------------------

**Documento:** OTJ-DATA-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 2 --- Princípios do Modelo de Dados

**Próximo capítulo:** Capítulo 3 --- Entidades Base
