# OTJ-BACKEND-V03 --- Serviços Internos

**Projeto:** O Tio do Joca\
**Documento:** OTJ-BACKEND-V03-Servicos-Internos\
**Área:** Backend / Serviços / Regras de Negócio\
**Estado:** Especificação inicial

------------------------------------------------------------------------

# 1. Introdução

Este documento define os serviços internos responsáveis pelo
processamento das regras de negócio da plataforma **O Tio do Joca**.

Os serviços internos permitem separar a lógica da aplicação dos
restantes componentes do sistema.

------------------------------------------------------------------------

# 2. Objetivos

Os serviços internos devem garantir:

-   Organização da lógica de negócio
-   Reutilização de funcionalidades
-   Facilidade de manutenção
-   Escalabilidade
-   Separação de responsabilidades

------------------------------------------------------------------------

# 3. Estrutura dos Serviços

    Backend OTJ

    |
    +-- Auth Service
    |
    +-- User Service
    |
    +-- Community Service
    |
    +-- Checklist Service
    |
    +-- Knowledge Service
    |
    +-- Event Service
    |
    +-- Marketplace Service
    |
    +-- Notification Service

------------------------------------------------------------------------

# 4. Auth Service

Responsável por:

-   Autenticação
-   Gestão de sessões
-   Tokens JWT
-   Recuperação de acesso
-   Validação de utilizadores

------------------------------------------------------------------------

# 5. User Service

Responsável por:

-   Gestão de perfis
-   Preferências
-   Permissões
-   Relações institucionais

------------------------------------------------------------------------

# 6. Community Service

Responsável por:

-   Gestão do fórum
-   Publicações
-   Comentários
-   Moderação
-   Interações entre utilizadores

------------------------------------------------------------------------

# 7. Checklist Service

Serviço central do OTJ.

Responsável por:

-   Criar checklists
-   Gerir tarefas
-   Atualizar estados
-   Criar alertas
-   Guardar histórico

Exemplo:

    Cultura: Tomate

    Semear
    |
    Transplantar
    |
    Regar
    |
    Tratar
    |
    Colher

------------------------------------------------------------------------

# 8. Knowledge Service

Responsável pela base de conhecimento:

-   Plantas
-   Animais
-   Agricultura
-   Jardinagem
-   Tradições

------------------------------------------------------------------------

# 9. Event Service

Responsável por:

-   Eventos locais
-   Calendários
-   Publicações institucionais

------------------------------------------------------------------------

# 10. Marketplace Service

Serviço futuro para:

-   Produtos
-   Produtores
-   Encomendas
-   Pagamentos

------------------------------------------------------------------------

# 11. Notification Service

Responsável por:

-   Emails
-   Alertas
-   Notificações móveis
-   Avisos de atividades

------------------------------------------------------------------------

# 12. Comunicação entre Serviços

Modelo previsto:

    Serviço A

        |

    Camada de comunicação

        |

    Serviço B

Possíveis tecnologias futuras:

-   REST
-   Eventos internos
-   Filas de mensagens

------------------------------------------------------------------------

# 13. Estado Atual

Documento:

    OTJ-BACKEND-V03-Servicos-Internos.md

Objetivo:

Definir a organização dos serviços internos do Backend da plataforma **O
Tio do Joca**.

------------------------------------------------------------------------

Fim do documento.
