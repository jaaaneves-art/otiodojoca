# OTJ-QA-V06 — Testes de Segurança

**Código:** OTJ-QA-V06  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Qualidade e Testes (QA)  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de testes de segurança do projeto O Tio do Joca (OTJ), garantindo que a plataforma protege os dados, os utilizadores e a infraestrutura contra vulnerabilidades e ataques.

---

# Conceito

Os testes de segurança têm como finalidade identificar vulnerabilidades antes da disponibilização da aplicação em produção, reduzindo o risco de exploração por agentes maliciosos.

---

# Objetivos

- Identificar vulnerabilidades.
- Validar mecanismos de autenticação e autorização.
- Proteger dados sensíveis.
- Verificar a resistência a ataques comuns.
- Cumprir boas práticas de desenvolvimento seguro.

---

# Âmbito

Os testes deverão abranger:

- Frontend.
- Backend.
- APIs.
- Base de dados.
- Infraestrutura.
- Integrações com serviços externos.

---

# Áreas de Validação

- Autenticação.
- Gestão de sessões.
- Controlo de acessos.
- Validação de entradas.
- Proteção contra SQL Injection.
- Proteção contra Cross-Site Scripting (XSS).
- Proteção contra Cross-Site Request Forgery (CSRF).
- Configuração HTTPS e certificados.
- Gestão de segredos.

---

# Automatização

Sempre que possível, os testes de segurança deverão integrar a pipeline CI/CD, permitindo detetar vulnerabilidades de forma contínua.

---

# Boas Práticas

- Atualizar dependências regularmente.
- Corrigir vulnerabilidades com prioridade.
- Não expor informação sensível em mensagens de erro.
- Rever permissões periodicamente.
- Registar e acompanhar incidentes de segurança.

---

# Critérios de Aprovação

Uma versão só deverá ser considerada apta para produção quando:

- Não existirem vulnerabilidades críticas conhecidas.
- Os controlos de autenticação funcionarem corretamente.
- As comunicações utilizarem HTTPS.
- Os testes de segurança essenciais forem aprovados.

---

# Conclusão

Os testes de segurança são fundamentais para garantir a confiança, a disponibilidade e a proteção da plataforma OTJ ao longo do seu ciclo de vida.

---

**Fim do documento**
