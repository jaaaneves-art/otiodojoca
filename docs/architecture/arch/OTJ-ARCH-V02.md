# OTJ-ARCH-V02 --- Modelo do Domínio

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V02\
**Estado:** Em elaboração\
**Versão:** 1.0

------------------------------------------------------------------------

# 1. Objetivo

Definir o modelo do domínio do OTJ, identificando os principais objetos
de negócio e as relações de alto nível entre eles.

------------------------------------------------------------------------

# 2. O que é o Domínio

O domínio representa os conceitos fundamentais do projeto,
independentemente da tecnologia utilizada.

O objetivo é modelar a realidade que o OTJ pretende representar e gerir.

------------------------------------------------------------------------

# 3. Objetos Fundamentais

O modelo do domínio assenta nos seguintes objetos:

-   Utilizador
-   Perfil
-   Entidade
-   Organização
-   Localização
-   Conteúdo
-   Taxonomia
-   Recurso
-   Relação

------------------------------------------------------------------------

# 4. Utilizador

Representa uma pessoa autenticada na plataforma.

Responsabilidades:

-   autenticação;
-   participação;
-   criação de conteúdos;
-   interação com a comunidade.

------------------------------------------------------------------------

# 5. Entidade

Uma entidade representa qualquer elemento permanente do conhecimento.

Exemplos:

-   Pessoa
-   Planta
-   Animal
-   Monumento
-   Produto
-   Município
-   Tradição

------------------------------------------------------------------------

# 6. Conteúdo

Representa informação produzida sobre uma ou mais entidades.

Exemplos:

-   artigo;
-   documento;
-   notícia;
-   receita;
-   evento.

------------------------------------------------------------------------

# 7. Organização

Representa instituições que participam no ecossistema OTJ.

Exemplos:

-   Municípios
-   Juntas de Freguesia
-   Associações
-   Cooperativas
-   Museus
-   Empresas

------------------------------------------------------------------------

# 8. Localização

Define o contexto geográfico das entidades e conteúdos.

------------------------------------------------------------------------

# 9. Taxonomias

Permitem classificar entidades e conteúdos através de uma estrutura
comum e reutilizável.

------------------------------------------------------------------------

# 10. Princípio do Modelo

Os módulos do OTJ não são ilhas independentes.

Todos reutilizam os mesmos objetos do domínio e acrescentam apenas o
comportamento específico necessário.

------------------------------------------------------------------------

## Estado

Primeira versão em elaboração. Os capítulos seguintes aprofundarão cada
objeto e as respetivas relações.
