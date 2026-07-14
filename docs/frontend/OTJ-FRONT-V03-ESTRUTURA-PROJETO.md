# OTJ-FRONT-V03 --- Estrutura do Projeto Frontend

## Projeto

**O Tio do Joca (OTJ)**

## Área

Frontend da Plataforma OTJ

------------------------------------------------------------------------

# Objetivo

Este documento define a organização interna do projeto frontend da
plataforma O Tio do Joca.

A estrutura deve facilitar desenvolvimento, manutenção, testes e
evolução futura.

------------------------------------------------------------------------

# Estrutura Principal

``` text
frontend/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── assets/
│
├── src/
│   │
│   ├── app/
│   │   ├── layout/
│   │   ├── pages/
│   │   └── routes/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   └── navigation/
│   │
│   ├── features/
│   │   ├── comunidade/
│   │   ├── agricultura/
│   │   ├── eventos/
│   │   └── marketplace/
│   │
│   ├── services/
│   │   ├── api/
│   │   └── authentication/
│   │
│   ├── hooks/
│   │
│   ├── store/
│   │
│   ├── styles/
│   │
│   └── utils/
│
├── package.json
└── README.md
```

------------------------------------------------------------------------

# Descrição das Pastas

## public

Ficheiros estáticos:

-   imagens;
-   ícones;
-   recursos visuais.

------------------------------------------------------------------------

## src

Código principal da aplicação.

------------------------------------------------------------------------

## components

Componentes reutilizáveis da interface.

Exemplos:

-   botões;
-   menus;
-   cartões;
-   formulários.

------------------------------------------------------------------------

## features

Módulos funcionais da plataforma.

Exemplos:

-   comunidade;
-   produtores;
-   eventos;
-   comércio.

------------------------------------------------------------------------

## services

Comunicação com serviços externos.

Inclui:

-   APIs;
-   autenticação;
-   integrações.

------------------------------------------------------------------------

## hooks

Funções reutilizáveis relacionadas com lógica React.

------------------------------------------------------------------------

## store

Gestão global de estado da aplicação.

------------------------------------------------------------------------

## styles

Definições visuais globais.

------------------------------------------------------------------------

## utils

Funções auxiliares utilizadas pela aplicação.

------------------------------------------------------------------------

# Organização por Módulos

Cada funcionalidade importante deve possuir:

-   componentes próprios;
-   serviços próprios;
-   regras próprias;
-   testes próprios.

------------------------------------------------------------------------

# Estado

Documento inicial da estrutura frontend.

Versão: V03\
Projeto: OTJ --- O Tio do Joca\
Área: Frontend
