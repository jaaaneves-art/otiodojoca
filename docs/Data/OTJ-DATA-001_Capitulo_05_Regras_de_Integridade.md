# OTJ-DATA-001 --- Modelo de Dados Completo

# Capítulo 5 --- Regras de Integridade

## 5.1 Finalidade

Este capítulo estabelece as regras de integridade que deverão ser
aplicadas ao modelo de dados do Projeto O Tio do Joca. O objetivo é
garantir que a informação armazenada permanece correta, consistente,
rastreável e fiável ao longo de todo o seu ciclo de vida.

## 5.2 Objetivos

As regras de integridade deverão:

-   assegurar consistência dos dados;
-   impedir informação inválida;
-   proteger as relações entre entidades;
-   facilitar auditoria e manutenção;
-   apoiar a evolução segura da base de dados.

## 5.3 Integridade das Entidades

Todas as entidades deverão possuir:

-   identificador único;
-   atributos obrigatórios devidamente definidos;
-   validação dos tipos de dados;
-   restrições de unicidade quando aplicável.

## 5.4 Integridade Referencial

As relações entre entidades deverão ser garantidas através de chaves
primárias e estrangeiras, impedindo referências inválidas e assegurando
a coerência entre módulos.

## 5.5 Validação e Auditoria

Os dados deverão ser sujeitos a validações técnicas e funcionais,
mantendo, sempre que aplicável:

-   datas de criação e atualização;
-   identificação do autor da alteração;
-   histórico de versões;
-   registos de auditoria.

## 5.6 Evolução

As regras de integridade deverão acompanhar a evolução do modelo de
dados, sendo revistas sempre que novas entidades, relações ou requisitos
funcionais forem introduzidos.

## 5.7 Síntese

A aplicação consistente destas regras constitui um dos pilares da
qualidade da informação, garantindo que a base de dados do Projeto O Tio
do Joca permanece fiável, consistente e preparada para crescer de forma
sustentável.

------------------------------------------------------------------------

**Documento:** OTJ-DATA-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 5 --- Regras de Integridade

**Próximo capítulo:** Capítulo 6 --- Versionamento
