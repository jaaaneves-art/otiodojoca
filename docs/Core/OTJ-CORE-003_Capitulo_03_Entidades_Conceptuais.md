# OTJ-CORE-003 --- Modelo Conceptual da Informação

# Capítulo 3 --- Entidades Conceptuais

## 3.1 Finalidade

Este capítulo identifica as entidades conceptuais fundamentais do
ecossistema do Projeto O Tio do Joca. Uma entidade representa um tipo de
objeto ou conceito sobre o qual o sistema necessita de armazenar,
relacionar ou disponibilizar informação.

A definição destas entidades estabelece uma base comum para a
arquitetura da informação, para os modelos de dados e para a
interoperabilidade entre módulos.

## 3.2 Princípios

As entidades conceptuais deverão:

-   representar conceitos estáveis do domínio;
-   possuir uma identidade própria;
-   poder relacionar-se com outras entidades;
-   evitar redundâncias;
-   ser independentes da implementação técnica.

## 3.3 Entidades Fundamentais

O ecossistema deverá considerar, entre outras, as seguintes entidades:

-   Utilizador;
-   Perfil;
-   Artigo;
-   Documento;
-   Publicação;
-   Tópico;
-   Resposta;
-   Comentário;
-   Evento;
-   Anúncio;
-   Recurso Digital;
-   Categoria;
-   Etiqueta;
-   Coleção;
-   Local;
-   Organização;
-   Autor;
-   Calendário;
-   Notificação.

Estas entidades poderão ser especializadas ou estendidas em documentos
específicos.

## 3.4 Identidade

Cada entidade deverá possuir um identificador permanente e único,
permitindo a sua referência ao longo de todo o ecossistema,
independentemente do módulo onde é utilizada.

## 3.5 Relacionamentos

As entidades poderão estabelecer relações entre si, tais como:

-   pertence a;
-   contém;
-   referencia;
-   é autor de;
-   está associado a;
-   faz parte de;
-   deriva de.

As regras detalhadas destes relacionamentos serão definidas no capítulo
seguinte.

## 3.6 Reutilização

Sempre que possível, uma entidade deverá ser reutilizada por diferentes
módulos, evitando a criação de representações distintas para o mesmo
conceito.

## 3.7 Síntese

A identificação das entidades conceptuais constitui a base do modelo de
informação do Projeto O Tio do Joca e orientará a definição das
relações, metadados e modelos de dados que suportam o ecossistema.

------------------------------------------------------------------------

**Documento:** OTJ-CORE-003

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 3 --- Entidades Conceptuais

**Próximo capítulo:** Capítulo 4 --- Relações entre Entidades
