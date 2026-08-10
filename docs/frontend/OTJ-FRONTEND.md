# OTJ-FRONTEND --- Arquitetura do Frontend

**Projeto:** O Tio do Joca (OTJ)\
**Documento:** OTJ-FRONTEND\
**Área:** Frontend / Interface / Experiência do Utilizador\
**Estado:** Documento de referência

------------------------------------------------------------------------

# 1. Introdução

O Frontend da plataforma **O Tio do Joca** é a camada responsável pela
interação com o utilizador, apresentando a informação de forma simples,
intuitiva e acessível.

É a interface entre o utilizador e os serviços disponibilizados pelo
Backend.

------------------------------------------------------------------------

# 2. Objetivos

O Frontend deve garantir:

-   Interface intuitiva e responsiva;
-   Excelente experiência de utilização (UX);
-   Design consistente;
-   Acessibilidade;
-   Elevado desempenho;
-   Integração segura com a API.

------------------------------------------------------------------------

# 3. Arquitetura Geral

``` text
Utilizador
      │
      ▼
Frontend (Next.js)
      │
      ▼
API OTJ
      │
      ▼
Backend
      │
      ▼
Supabase / PostgreSQL
```

------------------------------------------------------------------------

# 4. Tecnologias

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   Supabase Client

------------------------------------------------------------------------

# 5. Organização

O Frontend está organizado por componentes reutilizáveis, páginas,
layouts e serviços, seguindo boas práticas de modularidade.

------------------------------------------------------------------------

# 6. Funcionalidades Principais

-   Autenticação
-   Gestão de perfis
-   Fórum
-   Mercado da Terra
-   Eventos
-   Pesquisa
-   Checklists
-   Conteúdos do Almanaque

------------------------------------------------------------------------

# 7. Integração

O Frontend comunica exclusivamente com o Backend e com os serviços
autorizados através da API, mantendo separadas a lógica de apresentação
e a lógica de negócio.

------------------------------------------------------------------------

# 8. Coleção de Documentos

A documentação detalhada encontra-se nos documentos:

-   OTJ-FRONT-V00 --- Índice
-   OTJ-FRONT-V01 --- Arquitetura
-   OTJ-FRONT-V02 --- Tecnologias
-   OTJ-FRONT-V03 --- Estrutura do Projeto
-   OTJ-FRONT-V04 --- Componentes
-   OTJ-FRONT-V05 --- Interface
-   OTJ-FRONT-V06 --- Autenticação
-   OTJ-FRONT-V07 --- Rotas
-   OTJ-FRONT-V08 --- Estado e Dados
-   OTJ-FRONT-V09 --- Segurança

------------------------------------------------------------------------

# 9. Objetivo do Documento

Este documento fornece uma visão global do Frontend e serve como ponto
de entrada para toda a documentação técnica desta área.
