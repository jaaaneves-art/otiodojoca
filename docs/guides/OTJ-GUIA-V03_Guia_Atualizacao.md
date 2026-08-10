# OTJ-GUIA-V03 --- Guia de Atualização

## Objetivo

Este guia descreve o processo recomendado para atualizar a plataforma
**O Tio do Joca (OTJ)** de forma segura, minimizando o risco de
interrupções e garantindo a integridade dos dados.

## Público-alvo

-   Administradores de sistemas
-   DevOps
-   Equipa técnica

## Preparação

Antes de iniciar qualquer atualização:

-   Confirmar a versão atual da plataforma.
-   Consultar as notas de versão (Release Notes).
-   Verificar requisitos da nova versão.
-   Informar os utilizadores sobre a janela de manutenção.

## Cópias de Segurança

Efetuar cópias de segurança de:

-   Base de dados
-   Ficheiros enviados pelos utilizadores
-   Configurações
-   Variáveis de ambiente

Validar que as cópias podem ser restauradas.

## Processo de Atualização

1.  Colocar a aplicação em modo de manutenção (quando aplicável).
2.  Atualizar o código-fonte.
3.  Atualizar dependências.
4.  Executar migrações da base de dados.
5.  Reiniciar os serviços.
6.  Limpar caches, se necessário.

## Validação

Após a atualização:

-   Confirmar autenticação.
-   Validar ligação à base de dados.
-   Testar funcionalidades críticas.
-   Verificar logs da aplicação.
-   Confirmar desempenho.

## Plano de Reversão (Rollback)

Caso a atualização falhe:

1.  Restaurar a versão anterior da aplicação.
2.  Restaurar a base de dados a partir da cópia de segurança.
3.  Repor configurações anteriores.
4.  Validar o funcionamento da plataforma.

## Boas Práticas

-   Testar primeiro num ambiente de testes.
-   Atualizar fora do horário de maior utilização.
-   Documentar todas as alterações realizadas.
-   Manter um histórico de versões.

## Referências

-   DevOps
-   Infrastructure
-   Security
-   Operations
-   OTJ-PROD

## Histórico de Versões

  Versão   Data         Descrição
  -------- ------------ -----------------------------------------
  1.0      2026-07-14   Primeira versão do Guia de Atualização.
