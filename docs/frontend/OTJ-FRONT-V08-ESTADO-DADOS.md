# OTJ-FRONT-V08 --- Estado e Gestão de Dados

## Projeto

**O Tio do Joca (OTJ)**

## Área

Frontend da Plataforma OTJ

------------------------------------------------------------------------

# Objetivo

Este documento define a gestão de estado e tratamento de dados no
frontend da plataforma O Tio do Joca.

O objetivo é garantir organização, desempenho e consistência da
informação apresentada aos utilizadores.

------------------------------------------------------------------------

# Conceito de Estado

O estado representa a informação que a aplicação necessita manter
durante a utilização.

Exemplos:

-   utilizador autenticado;
-   preferências;
-   conteúdos carregados;
-   filtros;
-   dados temporários.

------------------------------------------------------------------------

# Tipos de Estado

## Estado Local

Dados utilizados apenas dentro de um componente.

Exemplos:

-   campos de formulário;
-   menus abertos;
-   seleções temporárias.

------------------------------------------------------------------------

## Estado Global

Dados partilhados por várias áreas da aplicação.

Exemplos:

-   sessão do utilizador;
-   permissões;
-   configurações gerais.

------------------------------------------------------------------------

## Estado de Servidor

Dados obtidos através do backend.

Exemplos:

-   publicações;
-   eventos;
-   anúncios;
-   perfis.

------------------------------------------------------------------------

# Comunicação com Backend

O frontend deve comunicar com os serviços através de:

-   APIs;
-   pedidos autenticados;
-   tratamento de respostas;
-   gestão de erros.

------------------------------------------------------------------------

# Tratamento de Dados

Deve existir:

-   validação de dados;
-   controlo de erros;
-   carregamento progressivo;
-   atualização automática quando necessário.

------------------------------------------------------------------------

# Desempenho

Boas práticas:

-   evitar pedidos desnecessários;
-   utilizar cache quando adequado;
-   carregar informação apenas quando necessária.

------------------------------------------------------------------------

# Preparação Futura

A gestão de dados deve suportar:

-   aplicação móvel;
-   PWA;
-   crescimento de utilizadores;
-   novos módulos.

------------------------------------------------------------------------

# Estado

Documento inicial de gestão de estado e dados.

Versão: V08\
Projeto: OTJ --- O Tio do Joca\
Área: Frontend
