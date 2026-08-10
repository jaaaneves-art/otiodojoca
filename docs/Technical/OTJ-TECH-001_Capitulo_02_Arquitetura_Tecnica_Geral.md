# OTJ-TECH-001 --- Livro Técnico do Projeto O Tio do Joca

# Capítulo 2 --- Arquitetura Técnica Geral

## 2.1 Finalidade

Este capítulo apresenta a arquitetura técnica geral do Projeto O Tio do
Joca, definindo a organização lógica da plataforma e a forma como os
seus principais componentes colaboram entre si.

## 2.2 Objetivos

A arquitetura técnica deverá:

-   assegurar modularidade;
-   facilitar a manutenção;
-   permitir crescimento progressivo;
-   garantir interoperabilidade;
-   promover elevado desempenho e disponibilidade.

## 2.3 Organização em Camadas

A plataforma organiza-se conceptualmente nas seguintes camadas:

1.  Interface do Utilizador (Frontend);
2.  Serviços de Aplicação (Backend);
3.  Serviços Partilhados;
4.  Persistência de Dados;
5.  Infraestrutura.

Cada camada possui responsabilidades bem definidas e comunica através de
interfaces estáveis.

## 2.4 Componentes Principais

A arquitetura integra, entre outros:

-   Portal Web;
-   Área de Administração;
-   API de Serviços;
-   Sistema de Autenticação;
-   Motor de Pesquisa;
-   Gestão de Conteúdos;
-   Base de Dados;
-   Armazenamento de Ficheiros;
-   Serviços de Monitorização.

## 2.5 Comunicação

Os componentes deverão comunicar recorrendo a APIs, serviços internos e
mecanismos de autenticação seguros, privilegiando baixo acoplamento e
elevada reutilização.

## 2.6 Evolução

A arquitetura deverá permitir a integração de novos módulos e
tecnologias sem comprometer a estabilidade, a compatibilidade ou a
segurança da plataforma.

## 2.7 Síntese

A arquitetura técnica geral estabelece uma base sólida, modular e
evolutiva para suportar o desenvolvimento sustentável do Projeto O Tio
do Joca.

------------------------------------------------------------------------

**Documento:** OTJ-TECH-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 2 --- Arquitetura Técnica Geral

**Próximo capítulo:** Capítulo 3 --- Tecnologias Utilizadas
