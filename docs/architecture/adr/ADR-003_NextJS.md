# ADR-003 --- Escolha do Next.js

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ necessita de um frontend moderno, escalável e de
elevado desempenho, capaz de suportar renderização eficiente, boa
experiência de utilizador e integração com o backend baseado em
Supabase.

## Problema

Selecionar uma framework frontend que ofereça:

-   Elevado desempenho
-   SEO quando aplicável
-   Estrutura organizada
-   Boa experiência de desenvolvimento
-   Integração simples com React e Supabase

## Alternativas Consideradas

### Next.js

-   Baseado em React.
-   App Router.
-   Renderização híbrida (SSR, SSG e CSR).
-   Excelente ecossistema.

### React (Vite)

-   Muito flexível.
-   Requer configuração adicional para várias funcionalidades.

### Nuxt

-   Excelente solução, mas baseada em Vue, não alinhada com a decisão de
    utilizar React.

## Decisão

Adotar o **Next.js** como framework oficial do frontend da plataforma
OTJ.

## Justificação

O Next.js fornece uma arquitetura moderna, excelente desempenho,
organização por rotas, otimizações automáticas e integração natural com
React, TypeScript e Supabase, reduzindo o esforço de desenvolvimento.

## Consequências

### Positivas

-   Elevado desempenho.
-   Excelente organização do projeto.
-   Ecossistema maduro.
-   Boa integração com autenticação e APIs.
-   Escalabilidade para futuras funcionalidades.

### Negativas

-   Curva de aprendizagem para funcionalidades avançadas.
-   Atualizações frequentes que exigem acompanhamento.

## Impacto

Afeta diretamente:

-   Frontend
-   API
-   Autenticação
-   DevOps
-   UX
-   Performance

## Referências

-   Architecture
-   Frontend
-   DevOps
-   UX
-   ADR-001
-   ADR-002

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ------------------------------------------
  1.0      2026-07-14   Registo da decisão de adoção do Next.js.
