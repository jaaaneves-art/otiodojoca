# O Tio do Joca

## Visão Geral

**O Tio do Joca** é uma plataforma digital dedicada à preservação e
divulgação da cultura, tradições, património, agricultura e mundo rural
português.

## Objetivos

-   Valorizar o património português.
-   Apoiar produtores e comunidades locais.
-   Disponibilizar conhecimento organizado.
-   Criar uma comunidade colaborativa.

## Tecnologias

-   Next.js
-   React
-   TypeScript
-   Supabase
-   PostgreSQL
-   Vercel

## Estrutura do Projeto

-   Portal Institucional
-   Fórum
-   Mercado da Terra
-   Biblioteca Digital
-   Almanaque Tradicional
-   Enciclopédia Rural
-   Municípios
-   Freguesias
-   Produtores
-   Utilizadores
-   Administração
-   Inteligência Artificial

## Documentação

Toda a documentação oficial encontra-se na pasta `docs/`.

Inclui:

-   Documentos estruturantes (OTJ-CORE, OTJ-WHITE, OTJ-TECH, etc.)
-   Especificações funcionais (OTJ-FUNC)

## Instalação

``` bash
npm install
npm run dev
```

## Database & Migrações (Supabase CLI)

A partir de **agosto de 2026**, o projeto utiliza **Supabase CLI** para versionamento e migração de schema.

### Quick Start

```bash
# Criar nova migração
npx supabase migration new nome_descritivo

# Testar localmente
npx supabase start
npx supabase db push

# Aplicar em produção
npx supabase db push
```

**⚠️ Importante:** Não edite o schema directamente no painel Supabase. Use sempre migrations.

Para documentação completa, leia: [`docs/SUPABASE-CLI-SETUP.md`](docs/SUPABASE-CLI-SETUP.md)

## Licença

A definir.
