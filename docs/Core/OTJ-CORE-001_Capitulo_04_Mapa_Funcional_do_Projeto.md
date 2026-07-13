# OTJ-CORE-001 --- Arquitetura Conceptual do Projeto O Tio do Joca

# Capítulo 4 --- Mapa Funcional do Projeto

## 4.1 Objetivo

O mapa funcional identifica os principais módulos que compõem o
ecossistema do Projeto O Tio do Joca, define a sua finalidade e
estabelece a forma como cooperam entre si. Constitui uma referência
conceptual para a evolução futura da plataforma.

## 4.2 Organização Geral

O projeto organiza-se em módulos especializados, desenvolvidos de forma
independente mas integrados através de serviços comuns. Cada módulo
possui um domínio funcional bem definido e deverá evitar sobreposição de
responsabilidades.

## 4.3 Módulos Principais

### 4.3.1 Portal Institucional

É o ponto de entrada da plataforma. Apresenta o projeto, disponibiliza
conteúdos institucionais, notícias e acesso aos restantes módulos.

Principais responsabilidades:

-   apresentar a identidade do projeto;
-   divulgar novidades;
-   facilitar a navegação;
-   disponibilizar pesquisa global.

### 4.3.2 Fórum da Comunidade

Espaço de participação e partilha de conhecimento.

Principais responsabilidades:

-   organizar discussões por categorias;
-   preservar conhecimento produzido pela comunidade;
-   apoiar moderação e colaboração.

### 4.3.3 Biblioteca Digital

Repositório de documentos e publicações.

Exemplos de conteúdos:

-   livros;
-   artigos;
-   documentos históricos;
-   ficheiros multimédia.

### 4.3.4 Almanaque

Reúne conteúdos organizados pelo calendário, ciclos naturais,
agricultura, tradições e efemérides, promovendo a preservação da
sabedoria popular.

### 4.3.5 Enciclopédia

Disponibiliza artigos de referência sobre Portugal, organizados por
temas e sujeitos a critérios editoriais definidos.

### 4.3.6 Feira

Área destinada à publicação de anúncios pela comunidade, com categorias,
pesquisa e mecanismos de contacto entre utilizadores.

### 4.3.7 Administração

Conjunto de ferramentas destinadas à gestão técnica, editorial e
comunitária da plataforma.

## 4.4 Serviços Transversais

Todos os módulos utilizam um conjunto comum de serviços:

-   autenticação;
-   perfis de utilizador;
-   notificações;
-   pesquisa;
-   documentação;
-   permissões;
-   registo de auditoria.

## 4.5 Evolução do Ecossistema

Novos módulos poderão ser integrados desde que:

-   respondam a uma necessidade identificada;
-   respeitem os princípios definidos em OTJ-CORE-001;
-   reutilizem os serviços transversais sempre que possível;
-   mantenham a coerência funcional do ecossistema.

## 4.6 Síntese

O mapa funcional constitui uma visão de alto nível do projeto e serve de
referência para o desenvolvimento técnico, editorial e organizacional
dos diferentes módulos.

------------------------------------------------------------------------

**Documento:** OTJ-CORE-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 4 --- Mapa Funcional do Projeto

**Próximo capítulo:** Capítulo 5 --- Utilizadores e Perfis do
Ecossistema
