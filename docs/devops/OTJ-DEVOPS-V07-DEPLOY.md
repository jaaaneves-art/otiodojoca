# OTJ-DEVOPS-V07 — Deploy

**Código:** OTJ-DEVOPS-V07  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de deploy do projeto O Tio do Joca (OTJ), garantindo que a publicação de novas versões é previsível, segura, automatizada e facilmente reversível.

---

# Conceito

O deploy corresponde ao processo de disponibilização de uma nova versão da plataforma para um determinado ambiente.

Sempre que possível, este processo deverá ser automatizado através da pipeline de CI/CD.

---

# Ambientes de Deploy

Os deploys poderão ocorrer nos seguintes ambientes:

- Desenvolvimento
- Testes
- Homologação (Staging)
- Produção

Cada ambiente possui configurações e objetivos próprios.

---

# Processo de Deploy

Fluxo recomendado:

```text
Programador
      │
      ▼
Git (Push / Pull Request)
      │
      ▼
Pipeline CI
      │
      ▼
Validação
      │
      ▼
Build
      │
      ▼
Deploy para o ambiente correspondente
      │
      ▼
Verificação pós-deploy
```

---

# Requisitos

Antes de qualquer deploy devem ser verificados:

- Código validado.
- Testes concluídos.
- Configuração correta.
- Variáveis de ambiente disponíveis.
- Backups recentes.

---

# Estratégias de Deploy

Sempre que adequado poderão ser utilizadas estratégias como:

- Rolling Update
- Blue/Green Deployment
- Canary Deployment

A escolha dependerá da infraestrutura disponível e do impacto esperado.

---

# Rollback

Todos os deploys deverão permitir reversão rápida em caso de falha.

O rollback deverá:

- Restaurar a versão anterior.
- Preservar os dados.
- Minimizar indisponibilidade.

---

# Boas práticas

- Automatizar o processo.
- Evitar alterações manuais em produção.
- Registar todas as implementações.
- Validar após o deploy.
- Notificar a equipa em caso de erro.

---

# Segurança

Durante o deploy deverão ser protegidos:

- Segredos.
- Tokens.
- Chaves privadas.
- Certificados.
- Credenciais.

Nunca deverão estar incluídos no código-fonte.

---

# Conclusão

Uma estratégia de deploy bem definida reduz riscos operacionais, melhora a qualidade das entregas e facilita a evolução contínua da plataforma OTJ.

---

**Fim do documento**
