# OTJ-CORE-003 --- Modelo Conceptual da Informação

# Capítulo 4 --- Relações entre Entidades

## 4.1 Finalidade

Este capítulo define os princípios que regulam as relações entre as
entidades conceptuais do Projeto O Tio do Joca. As relações permitem
transformar um conjunto de entidades independentes numa rede coerente de
conhecimento, facilitando a navegação, a pesquisa e a reutilização da
informação.

## 4.2 Princípios Gerais

As relações entre entidades deverão:

-   representar ligações reais e significativas;
-   evitar redundâncias;
-   preservar a integridade da informação;
-   permitir evolução sem comprometer a compatibilidade;
-   ser independentes da implementação técnica.

## 4.3 Tipos de Relações

As entidades poderão estabelecer, entre outras, as seguintes relações:

-   pertence a;
-   contém;
-   referencia;
-   é autor de;
-   responde a;
-   comenta;
-   está associado a;
-   utiliza;
-   faz parte de;
-   deriva de.

Uma mesma entidade poderá participar em várias relações distintas.

## 4.4 Cardinalidade Conceptual

As relações poderão assumir diferentes cardinalidades, incluindo:

-   um para um;
-   um para muitos;
-   muitos para um;
-   muitos para muitos.

A cardinalidade deverá refletir o domínio funcional e não limita a
futura implementação técnica.

## 4.5 Integridade Conceptual

Nenhuma relação deverá criar ambiguidades quanto ao significado das
entidades envolvidas.

Sempre que uma entidade dependa conceptualmente de outra, essa
dependência deverá ser explicitamente documentada.

## 4.6 Navegação

As relações deverão permitir ao utilizador descobrir informação
relacionada de forma natural.

Exemplos:

-   um artigo poderá referenciar documentos da Biblioteca;
-   um tópico do Fórum poderá estar associado a um artigo da
    Enciclopédia;
-   um evento poderá estar relacionado com uma localização, uma
    organização e conteúdos do Almanaque.

## 4.7 Evolução

Novas relações poderão ser introduzidas sempre que representem
necessidades reais do domínio e mantenham a coerência do modelo
conceptual.

## 4.8 Síntese

As relações entre entidades constituem a estrutura que liga toda a
informação do ecossistema, permitindo construir um património digital
interligado, pesquisável e preparado para evoluir ao longo do tempo.

------------------------------------------------------------------------

**Documento:** OTJ-CORE-003

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 4 --- Relações entre Entidades

**Próximo capítulo:** Capítulo 5 --- Metadados
