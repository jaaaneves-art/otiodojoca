# OTJ-DATA-001 --- Modelo de Dados Completo

# Capítulo 3 --- Entidades Base

## 3.1 Finalidade

Este capítulo identifica as entidades fundamentais que constituem o
modelo de dados do Projeto O Tio do Joca. Estas entidades representam os
principais objetos de informação do ecossistema e servem de base para
todos os módulos da plataforma.

## 3.2 Objetivos

As entidades base deverão:

-   representar corretamente o domínio funcional;
-   permitir reutilização entre módulos;
-   assegurar consistência da informação;
-   facilitar a evolução do sistema;
-   suportar relações claras e estáveis.

## 3.3 Entidades Transversais

O modelo poderá incluir, entre outras, as seguintes entidades:

-   Utilizador;
-   Perfil;
-   Papel;
-   Permissão;
-   Sessão;
-   Configuração.

## 3.4 Entidades de Conteúdo

Para suportar os diferentes módulos do ecossistema, o modelo poderá
incluir:

-   Conteúdo;
-   Artigo;
-   Documento;
-   Categoria;
-   Etiqueta;
-   Ficheiro Multimédia;
-   Referência;
-   Fonte.

## 3.5 Entidades da Comunidade

As funcionalidades colaborativas poderão assentar em entidades como:

-   Fórum;
-   Tópico;
-   Publicação;
-   Comentário;
-   Reação;
-   Mensagem;
-   Evento;
-   Anúncio.

## 3.6 Relação entre Entidades

As entidades deverão relacionar-se através de identificadores únicos e
chaves de integridade, evitando duplicação de informação e promovendo
reutilização entre módulos.

## 3.7 Síntese

As entidades base constituem o núcleo do modelo de dados e servirão de
referência para a definição das relações, regras de integridade e
evolução da base de dados.

------------------------------------------------------------------------

**Documento:** OTJ-DATA-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 3 --- Entidades Base

**Próximo capítulo:** Capítulo 4 --- Relações
