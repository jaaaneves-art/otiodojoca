# OTJ-API --- Arquitetura, EndPoints e Serviços

**Projeto:** O Tio do Joca\
**Área:** API / Backend / Integrações\
**Estado:** Documento base consolidado

------------------------------------------------------------------------

# 1. Introdução

A API OTJ é a camada central de comunicação da plataforma **O Tio do
Joca**.

É responsável por ligar:

-   Aplicação Web
-   Aplicação Mobile / PWA
-   Painel Administrativo
-   Municípios
-   Juntas de Freguesia
-   Cooperativas
-   Associações
-   Produtores
-   Serviços externos

------------------------------------------------------------------------

# 2. Objetivos

A API deve garantir:

-   Segurança dos dados
-   Escalabilidade
-   Separação entre frontend e backend
-   Integração com serviços externos
-   Gestão de permissões
-   Auditoria
-   Crescimento futuro da plataforma

------------------------------------------------------------------------

# 3. Arquitetura Geral

    Utilizadores
         |
    Web / Mobile / PWA
         |
    OTJ API
         |
    -----------------------------
    Auth | Conteúdos | Comunidade | Marketplace
         |
    Base de Dados
         |
    Serviços Externos

------------------------------------------------------------------------

# 4. Tecnologias Previstas

-   Node.js + TypeScript
-   API REST
-   Supabase
-   PostgreSQL
-   JWT Authentication

------------------------------------------------------------------------

# 5. Estrutura Base

Prefixo:

    /api/v1/

------------------------------------------------------------------------

# 6. Módulos Principais

## Autenticação

    POST /auth/login
    POST /auth/register
    POST /auth/logout

Funções: - Registo - Login - Gestão de sessão - Recuperação de
palavra-passe

------------------------------------------------------------------------

## Utilizadores

    GET /users/me
    PUT /users/me
    DELETE /users/me

Dados: - Nome - Fotografia - Localidade - Preferências - Permissões

------------------------------------------------------------------------

## Comunidade

    GET /community/threads
    POST /community/threads
    POST /community/threads/{id}/comments

Inclui: - Fórum - Publicações - Comentários - Grupos

------------------------------------------------------------------------

## Checklists Inteligentes

    GET /checklists/{cultura}
    POST /checklists/activity

Exemplo:

Tomate: - Preparar terreno - Semear - Transplantar - Regar - Tratar -
Colher

------------------------------------------------------------------------

## Base de Conhecimento

Conteúdos: - Plantas - Animais - Árvores - Doenças - Pragas - Técnicas
tradicionais

------------------------------------------------------------------------

## Eventos Locais

Destinado a: - Municípios - Juntas de Freguesia - Associações -
Ranchos - Casas do Povo

Endpoints:

    POST /events
    GET /events/calendar

------------------------------------------------------------------------

## Marketplace

Inclui futuramente:

-   Produtos agrícolas
-   Produtores locais
-   Cooperativas
-   Comércio tradicional

------------------------------------------------------------------------

# 7. Segurança

Implementação prevista:

-   HTTPS
-   JWT Tokens
-   Refresh Tokens
-   Controlo de permissões
-   Rate Limiting
-   Logs
-   Auditoria

Perfis:

    ADMIN
    MUNICIPIO
    ASSOCIACAO
    PRODUTOR
    UTILIZADOR

------------------------------------------------------------------------

# 8. Versionamento

    V00 - Arquitetura Base
    V01 - EndPoints
    V02 - Segurança
    V03 - Integrações
    V04 - Testes

------------------------------------------------------------------------

# 9. Estado Atual

Documento:

    OTJ-API.md

Objetivo:

Definir a arquitetura e funcionamento inicial da API da plataforma **O
Tio do Joca**.

------------------------------------------------------------------------

Fim do documento.
