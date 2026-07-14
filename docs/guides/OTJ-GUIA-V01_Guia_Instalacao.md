# OTJ-GUIA-V01 --- Guia de Instalação

## Objetivo

Este guia descreve o processo de instalação da plataforma **O Tio do
Joca (OTJ)** num ambiente de desenvolvimento, testes ou produção.

## Público-alvo

-   Administradores de sistemas
-   DevOps
-   Equipa técnica
-   Parceiros de implementação

## Pré-requisitos

### Hardware

-   CPU: 4 núcleos (mínimo)
-   Memória: 8 GB RAM (mínimo)
-   Armazenamento: 50 GB livres

### Software

-   Git
-   Node.js (LTS)
-   npm
-   PostgreSQL (quando aplicável)
-   Docker e Docker Compose (opcional)
-   Conta Supabase (quando utilizado)

## Passos de Instalação

### 1. Obter o código-fonte

``` bash
git clone <repositorio>
cd otiodojoca
```

### 2. Instalar dependências

``` bash
npm install
```

### 3. Configurar variáveis de ambiente

Criar o ficheiro `.env.local` e preencher as credenciais necessárias
(base de dados, autenticação e serviços externos).

### 4. Inicializar a base de dados

Executar os scripts SQL e confirmar que todas as tabelas e políticas
foram criadas corretamente.

### 5. Iniciar a aplicação

``` bash
npm run dev
```

### 6. Validar a instalação

-   Aceder à aplicação no navegador.
-   Confirmar autenticação.
-   Verificar ligação à base de dados.
-   Confirmar funcionamento dos principais módulos.

## Verificações Finais

-   Ambiente operacional.
-   Logs sem erros críticos.
-   Serviços ativos.
-   Backups configurados (produção).

## Resolução de Problemas

-   Verificar ficheiros `.env`.
-   Confirmar versões do Node.js e npm.
-   Validar acesso à base de dados.
-   Consultar logs da aplicação.

## Referências

-   Architecture
-   Backend
-   Frontend
-   DevOps
-   Infrastructure
-   Security
-   Operations

## Histórico de Versões

  Versão   Data         Descrição
  -------- ------------ ----------------------------------------
  1.0      2026-07-14   Primeira versão do Guia de Instalação.
