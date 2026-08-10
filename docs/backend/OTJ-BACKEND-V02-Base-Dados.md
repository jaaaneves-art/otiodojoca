# OTJ-BACKEND-V02 --- Base de Dados

**Projeto:** O Tio do Joca\
**Documento:** OTJ-BACKEND-V02-Base-Dados\
**Área:** Backend / Dados / Persistência\
**Estado:** Especificação inicial

------------------------------------------------------------------------

# 1. Introdução

A base de dados é o componente responsável pelo armazenamento
estruturado da informação da plataforma **O Tio do Joca**.

O sistema deverá suportar utilizadores, conteúdos, comunidade,
checklists, eventos e funcionalidades futuras.

------------------------------------------------------------------------

# 2. Objetivos

A base de dados deve garantir:

-   Organização da informação
-   Integridade dos dados
-   Segurança
-   Desempenho
-   Facilidade de evolução
-   Preparação para crescimento

------------------------------------------------------------------------

# 3. Tecnologia Prevista

Sistema:

    PostgreSQL

Possível utilização:

-   Supabase
-   PostgreSQL Managed
-   Serviços Cloud

------------------------------------------------------------------------

# 4. Estrutura Geral

    Base de Dados OTJ

    |
    +-- Utilizadores
    |
    +-- Perfis
    |
    +-- Comunidade
    |
    +-- Conteúdos
    |
    +-- Checklists
    |
    +-- Eventos
    |
    +-- Marketplace
    |
    +-- Auditoria

------------------------------------------------------------------------

# 5. Tabelas Principais

## Users

Dados dos utilizadores:

-   ID
-   Nome
-   Email
-   Estado
-   Data de criação

------------------------------------------------------------------------

## Profiles

Informação complementar:

-   Fotografia
-   Localidade
-   Preferências
-   Tipo de utilizador

------------------------------------------------------------------------

## Community

Armazena:

-   Tópicos
-   Publicações
-   Comentários
-   Interações

------------------------------------------------------------------------

## Knowledge

Base de conhecimento:

-   Plantas
-   Animais
-   Técnicas
-   Artigos

------------------------------------------------------------------------

## Checklists

Sistema inteligente OTJ:

-   Cultura
-   Tarefa
-   Data
-   Estado
-   Histórico

------------------------------------------------------------------------

## Events

Eventos locais:

-   Nome
-   Data
-   Local
-   Entidade responsável

------------------------------------------------------------------------

## Marketplace

Futuro:

-   Produtos
-   Produtores
-   Encomendas
-   Transações

------------------------------------------------------------------------

# 6. Relações Principais

Exemplo:

    Utilizador

        |

    Perfil

        |

    Checklists

        |

    Atividades

------------------------------------------------------------------------

# 7. Segurança dos Dados

Implementar:

-   Controlo de acesso
-   RLS (Row Level Security)
-   Backups
-   Auditoria
-   Proteção de dados pessoais

------------------------------------------------------------------------

# 8. Evolução Futura

Preparada para:

-   Novos módulos
-   Aplicações externas
-   Inteligência Artificial
-   Análise de dados
-   Integrações

------------------------------------------------------------------------

# 9. Estado Atual

Documento:

    OTJ-BACKEND-V02-Base-Dados.md

Objetivo:

Definir a estrutura base de armazenamento de dados do Backend da
plataforma **O Tio do Joca**.

------------------------------------------------------------------------

Fim do documento.
