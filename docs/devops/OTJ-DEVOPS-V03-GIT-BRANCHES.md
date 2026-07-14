# OTJ-DEVOPS-V03 — Git e Estratégia de Branches

**Código:** OTJ-DEVOPS-V03  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de utilização do Git e a organização das branches do repositório do projeto OTJ, garantindo colaboração segura, histórico consistente e facilidade na gestão de versões.

---

# Controlo de versões

O Git é o sistema oficial de controlo de versões do projeto.

Principais objetivos:

- Rastrear alterações.
- Facilitar o trabalho colaborativo.
- Permitir reversão de alterações.
- Manter um histórico completo.

---

# Repositório

Todo o código-fonte, documentação e configurações deverão estar centralizados no repositório oficial do projeto.

---

# Estratégia de Branches

## main

Branch principal.

Características:

- Código estável.
- Sempre pronto para produção.
- Protegida contra alterações diretas.

---

## develop

Branch de integração.

Características:

- Recebe funcionalidades concluídas.
- Base para testes e validação.

---

## feature/*

Branches dedicadas ao desenvolvimento de novas funcionalidades.

Exemplos:

- feature/autenticacao
- feature/forum
- feature/agenda

Após conclusão, devem ser integradas em `develop`.

---

## hotfix/*

Utilizadas para corrigir problemas urgentes em produção.

Exemplos:

- hotfix/login
- hotfix/api-timeout

Após validação, devem ser integradas em `main` e `develop`.

---

## release/*

Branches utilizadas para preparar uma nova versão da plataforma.

Permitem estabilização antes da publicação.

---

# Convenções de commits

As mensagens de commit devem ser claras e objetivas.

Exemplos:

- feat: adicionar autenticação
- fix: corrigir erro de login
- docs: atualizar documentação
- refactor: reorganizar serviços
- test: adicionar testes
- chore: atualizar dependências

---

# Pull Requests

Todas as alterações devem ser efetuadas através de Pull Requests.

Antes da aprovação deverão ser verificados:

- Código.
- Testes.
- Documentação.
- Compatibilidade.

---

# Boas práticas

- Commits pequenos e frequentes.
- Não desenvolver diretamente na `main`.
- Resolver conflitos antes da integração.
- Atualizar documentação sempre que necessário.

---

# Conclusão

Uma estratégia consistente de Git e branches melhora a qualidade do desenvolvimento, reduz conflitos e facilita a evolução contínua do projeto OTJ.

---

**Fim do documento**
