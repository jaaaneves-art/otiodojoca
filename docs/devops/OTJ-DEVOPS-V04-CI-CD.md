# OTJ-DEVOPS-V04 — CI/CD

**Código:** OTJ-DEVOPS-V04  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de Integração Contínua (CI) e Entrega/Implementação Contínua (CD) do projeto OTJ, promovendo automatização, qualidade e rapidez na disponibilização de novas versões.

---

# Conceitos

## Integração Contínua (CI)

A Integração Contínua consiste na validação automática de alterações sempre que são enviadas para o repositório.

Principais objetivos:

- Compilar o projeto.
- Executar testes automáticos.
- Validar qualidade do código.
- Detetar erros precocemente.

---

## Entrega Contínua (CD)

A Entrega Contínua automatiza a preparação e publicação de novas versões após validação.

Dependendo do ambiente, o deploy poderá exigir aprovação manual ou ser totalmente automático.

---

# Fluxo CI/CD

```text
Programador
      │
      ▼
Git / Pull Request
      │
      ▼
Pipeline CI
      │
      ├── Instala dependências
      ├── Executa testes
      ├── Verifica qualidade
      ├── Gera artefactos
      ▼
Pipeline CD
      │
      ├── Homologação
      └── Produção
```

---

# Ferramentas previstas

- GitHub
- GitHub Actions
- Docker
- Docker Compose
- Next.js
- Node.js
- Supabase

A infraestrutura poderá evoluir no futuro mantendo os mesmos princípios.

---

# Etapas da Pipeline

1. Obter o código do repositório.
2. Instalar dependências.
3. Executar testes automáticos.
4. Verificar qualidade do código.
5. Construir a aplicação.
6. Criar artefactos de distribuição.
7. Efetuar o deploy para o ambiente adequado.

---

# Critérios de aprovação

Uma pipeline só deverá prosseguir quando:

- Não existirem erros de compilação.
- Todos os testes forem aprovados.
- A configuração estiver válida.
- Os controlos de segurança forem concluídos.

---

# Boas práticas

- Automatizar o máximo possível.
- Evitar intervenção manual.
- Utilizar variáveis de ambiente.
- Registar todas as execuções.
- Permitir reversão rápida em caso de falha.

---

# Benefícios

- Menor tempo de entrega.
- Redução de erros humanos.
- Maior consistência.
- Melhor qualidade do software.
- Deploys previsíveis e repetíveis.

---

# Conclusão

A adoção de CI/CD constitui um elemento essencial da estratégia DevOps do OTJ, permitindo entregar novas funcionalidades de forma segura, rápida e controlada.

---

**Fim do documento**
