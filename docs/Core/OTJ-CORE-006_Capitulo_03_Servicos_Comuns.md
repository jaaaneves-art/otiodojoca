# OTJ-CORE-006 --- Modelo Conceptual Técnico

# Capítulo 3 --- Serviços Comuns

## 3.1 Finalidade

Os Serviços Comuns constituem o conjunto de funcionalidades técnicas
reutilizáveis por todos os módulos do Projeto O Tio do Joca. A sua
existência evita duplicação de componentes, promove a consistência do
ecossistema e simplifica a evolução da plataforma.

## 3.2 Objetivos

Os Serviços Comuns deverão:

-   disponibilizar funcionalidades transversais;
-   promover reutilização de componentes;
-   reduzir complexidade técnica;
-   garantir comportamento uniforme;
-   facilitar a manutenção do sistema.

## 3.3 Serviços Conceptuais

O ecossistema poderá disponibilizar, entre outros, os seguintes
serviços:

-   autenticação;
-   autorização e gestão de permissões;
-   perfis de utilizador;
-   pesquisa global;
-   notificações;
-   armazenamento de ficheiros;
-   auditoria;
-   configuração centralizada;
-   monitorização;
-   registo de eventos.

## 3.4 Reutilização

Todos os módulos deverão recorrer, sempre que possível, aos Serviços
Comuns existentes, evitando implementações paralelas para
funcionalidades idênticas.

## 3.5 Interfaces

Os Serviços Comuns deverão disponibilizar interfaces estáveis, bem
documentadas e independentes dos módulos consumidores, permitindo a sua
utilização por componentes atuais e futuros.

## 3.6 Evolução

Novos serviços poderão ser incorporados sempre que respondam a
necessidades transversais do ecossistema, preservando a compatibilidade
com os serviços já existentes.

## 3.7 Síntese

Os Serviços Comuns representam o núcleo técnico partilhado do Projeto O
Tio do Joca, assegurando consistência, reutilização e sustentabilidade
na evolução da plataforma.

------------------------------------------------------------------------

**Documento:** OTJ-CORE-006

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 3 --- Serviços Comuns

**Próximo capítulo:** Capítulo 4 --- Integração entre Componentes
