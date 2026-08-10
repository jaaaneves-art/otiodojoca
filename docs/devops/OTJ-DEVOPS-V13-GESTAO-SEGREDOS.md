# OTJ-DEVOPS-V13 — Gestão de Segredos

**Código:** OTJ-DEVOPS-V13  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a política de gestão de segredos do projeto O Tio do Joca (OTJ), garantindo a proteção de credenciais, chaves e outras informações sensíveis utilizadas pela plataforma.

---

# O que são segredos

Consideram-se segredos todas as informações confidenciais necessárias ao funcionamento da aplicação, incluindo:

- Palavras-passe
- Tokens
- Chaves API
- Certificados
- Chaves privadas
- Credenciais de bases de dados
- Segredos de autenticação

---

# Princípios

A gestão de segredos deverá respeitar os seguintes princípios:

- Nunca armazenar segredos no código-fonte.
- Aplicar o princípio do menor privilégio.
- Limitar o acesso apenas aos utilizadores e serviços autorizados.
- Renovar segredos periodicamente.
- Revogar imediatamente segredos comprometidos.

---

# Armazenamento

Os segredos deverão ser armazenados de forma segura através de:

- Variáveis de ambiente.
- Gestores de segredos (quando aplicável).
- Cofres de credenciais suportados pela infraestrutura.

Ficheiros `.env` utilizados localmente não deverão ser incluídos no repositório.

---

# Distribuição

A distribuição de segredos entre ambientes deverá ser controlada e auditável.

Cada ambiente (Desenvolvimento, Testes, Homologação e Produção) deverá possuir os seus próprios segredos.

---

# Rotação

Os segredos deverão ser renovados:

- Periodicamente.
- Após alterações de equipa.
- Sempre que exista suspeita de compromisso.
- Após incidentes de segurança.

---

# Auditoria

Devem ser registados:

- Criação de segredos.
- Alterações.
- Revogações.
- Acessos administrativos.

---

# Boas Práticas

- Utilizar segredos diferentes por ambiente.
- Evitar partilha manual de credenciais.
- Proteger cópias de segurança.
- Documentar procedimentos de renovação.
- Testar regularmente os mecanismos de recuperação.

---

# Conclusão

Uma gestão rigorosa de segredos reduz significativamente os riscos de segurança e constitui um elemento essencial da estratégia DevOps do projeto OTJ.

---

**Fim do documento**
