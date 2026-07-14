# OTJ-GUIA-V02 --- Guia de Configuração

## Objetivo

Descrever a configuração inicial e contínua da plataforma OTJ para os
diferentes ambientes (desenvolvimento, testes e produção).

## Público-alvo

-   Administradores de sistemas
-   DevOps
-   Equipa técnica

## Ambientes

-   Desenvolvimento
-   Testes
-   Produção

Cada ambiente deve possuir configurações, credenciais e recursos
próprios.

## Variáveis de Ambiente

Configurar, entre outras:

-   URL da aplicação
-   Chaves do Supabase
-   Credenciais da base de dados
-   SMTP para envio de e-mail
-   Armazenamento de ficheiros
-   Serviços externos
-   Chaves de API

## Autenticação

-   Configurar fornecedores de autenticação.
-   Ativar MFA quando aplicável.
-   Definir políticas de palavra-passe.
-   Configurar recuperação de conta.

## Base de Dados

-   Confirmar ligação.
-   Executar migrações.
-   Validar políticas RLS.
-   Configurar backups.

## Armazenamento

-   Configurar buckets.
-   Definir permissões.
-   Validar limites de armazenamento.

## Notificações

-   E-mail
-   Notificações na aplicação
-   Serviços externos (quando existentes)

## Configuração da Aplicação

-   Idioma
-   Fuso horário
-   Limites de carregamento
-   Funcionalidades opcionais
-   Registo de logs

## Validação

-   Testar autenticação.
-   Confirmar ligação à base de dados.
-   Verificar envio de e-mails.
-   Validar carregamento de ficheiros.

## Referências

-   Architecture
-   Backend
-   DevOps
-   Infrastructure
-   Security
-   Operations

## Histórico de Versões

  Versão   Data         Descrição
  -------- ------------ ------------------------------------------
  1.0      2026-07-14   Primeira versão do Guia de Configuração.
