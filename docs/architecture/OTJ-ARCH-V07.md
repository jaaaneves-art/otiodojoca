# OTJ-ARCH-V07 --- Módulos Funcionais

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V07\
**Estado:** Em elaboração\
**Versão:** 1.0

# 1. Objetivo

Definir a arquitetura funcional dos módulos que compõem o ecossistema
OTJ.

# 2. Princípios

Todos os módulos deverão:

-   reutilizar os serviços comuns da plataforma;
-   respeitar o modelo do domínio;
-   evitar duplicação de dados;
-   comunicar através de interfaces bem definidas.

# 3. Módulos

## Portal

Ponto de entrada da plataforma, divulgação institucional e acesso aos
restantes módulos.

## Fórum

Espaço de partilha de conhecimento, perguntas, respostas e discussão
entre utilizadores.

## Biblioteca

Gestão de documentos, livros, artigos, publicações e restantes recursos
documentais.

## Almanaque

Calendário de tarefas, tradições, efemérides, fases da Lua e
conhecimento sazonal.

## Enciclopédia

Base de conhecimento estruturada sobre entidades, património, espécies,
produtos e tradições.

## Feira

Publicação e gestão de anúncios, produtos, serviços e oportunidades.

## Agenda

Gestão de eventos, feiras, romarias, encontros e atividades.

## Administração

Gestão da plataforma, utilizadores, permissões, auditoria e
configurações.

# 4. Integração

Todos os módulos reutilizam:

-   Identidade;
-   Entidades;
-   Localizações;
-   Taxonomias;
-   Conteúdos;
-   Recursos Partilhados.

# 5. Benefícios

-   Arquitetura modular.
-   Elevada reutilização.
-   Facilidade de manutenção.
-   Evolução independente dos módulos.

# 6. Estado

Primeira versão em elaboração.
