# OTJ-FRONT-V07 --- Rotas e Navegação

## Projeto

**O Tio do Joca (OTJ)**

## Área

Frontend da Plataforma OTJ

------------------------------------------------------------------------

# Objetivo

Este documento define a organização das rotas e navegação da aplicação
frontend da plataforma O Tio do Joca.

A estrutura deve permitir uma navegação simples, intuitiva e preparada
para crescimento.

------------------------------------------------------------------------

# Princípios de Navegação

A navegação deve ser:

-   clara;
-   consistente;
-   acessível;
-   adaptada ao tipo de utilizador.

------------------------------------------------------------------------

# Estrutura Base de Rotas

``` text
/
├── página inicial
│
├── /login
│   └── autenticação
│
├── /registo
│   └── criação de conta
│
├── /perfil
│   └── área pessoal
│
├── /comunidade
│   └── publicações e interação
│
├── /agricultura
│   └── conteúdos agrícolas
│
├── /eventos
│   └── eventos e atividades
│
├── /mercado
│   └── marketplace
│
└── /admin
    └── gestão administrativa
```

------------------------------------------------------------------------

# Rotas Públicas

Acessíveis sem autenticação:

-   página inicial;
-   informação geral;
-   eventos públicos;
-   conteúdos disponibilizados.

------------------------------------------------------------------------

# Rotas Privadas

Necessitam de utilizador autenticado:

-   perfil;
-   criação de conteúdos;
-   gestão de anúncios;
-   áreas institucionais.

------------------------------------------------------------------------

# Navegação por Perfis

A interface deve adaptar menus conforme:

-   cidadão;
-   produtor;
-   cooperativa;
-   município;
-   administrador.

------------------------------------------------------------------------

# Preparação Futura

A estrutura deve permitir adicionar:

-   aplicação móvel;
-   PWA;
-   novas áreas funcionais.

------------------------------------------------------------------------

# Estado

Documento inicial de definição de rotas frontend.

Versão: V07\
Projeto: OTJ --- O Tio do Joca\
Área: Frontend
