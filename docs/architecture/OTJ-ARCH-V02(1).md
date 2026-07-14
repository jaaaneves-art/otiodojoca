# OTJ-ARCH-V02 --- Modelo do Domínio

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V02\
**Estado:** Em elaboração\
**Versão:** 1.0

# 1. Objetivo

Definir o modelo do domínio do OTJ e os seus objetos fundamentais.

# 2. Conceitos Fundamentais

O domínio é independente da tecnologia e representa a realidade que a
plataforma pretende modelar.

# 3. Objetos do Domínio

-   Utilizador
-   Perfil
-   Entidade
-   Organização
-   Localização
-   Conteúdo
-   Taxonomia
-   Recurso
-   Relação

# 4. Relações entre Objetos

## Utilizador

Cria conteúdos, participa na comunidade e pode representar organizações.

## Entidade

É o elemento central do conhecimento. Pode estar ligada a conteúdos,
localizações, taxonomias e outras entidades.

## Organização

É uma especialização de entidade e pode organizar eventos, publicar
conteúdos e administrar informação.

## Conteúdo

Representa conhecimento produzido sobre uma ou mais entidades.

## Localização

Contextualiza entidades, organizações, conteúdos e eventos.

## Taxonomia

Classifica e organiza entidades e conteúdos de forma consistente.

# 5. Regras do Modelo

-   Cada objeto tem uma responsabilidade bem definida.
-   A duplicação de informação deve ser evitada.
-   As relações são preferidas à repetição de dados.
-   Os módulos reutilizam os objetos do domínio.

# 6. Benefícios

-   Arquitetura consistente.
-   Evolução modular.
-   Pesquisa global.
-   Integração natural entre módulos.
-   Facilidade de manutenção.

# Estado

Versão intermédia. Em desenvolvimento.
