# OTJ-DEVOPS-V09 — Segurança

**Código:** OTJ-DEVOPS-V09  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de segurança da infraestrutura e dos processos DevOps do projeto O Tio do Joca (OTJ), garantindo a proteção dos sistemas, dos dados e dos utilizadores.

---

# Princípios

A segurança deverá ser considerada desde a fase de desenvolvimento até à operação em produção, adotando uma abordagem de *Security by Design*.

Princípios fundamentais:

- Menor privilégio.
- Defesa em profundidade.
- Atualização contínua.
- Automatização dos controlos.
- Monitorização permanente.

---

# Controlo de Acessos

Todos os acessos à infraestrutura deverão ser autenticados e autorizados.

Boas práticas:

- Utilização de autenticação multifator (MFA), sempre que possível.
- Contas individuais para cada colaborador.
- Revogação imediata de acessos desnecessários.
- Registo de atividades administrativas.

---

# Gestão de Segredos

Informações sensíveis nunca deverão estar incluídas no código-fonte.

Exemplos:

- Chaves API
- Tokens
- Palavras-passe
- Certificados
- Credenciais de bases de dados

A gestão deverá ser efetuada através de variáveis de ambiente ou serviços dedicados.

---

# Segurança da Infraestrutura

A infraestrutura deverá incluir:

- Firewall configurada.
- HTTPS obrigatório.
- Certificados SSL/TLS válidos.
- Atualizações regulares do sistema operativo.
- Atualizações das dependências.

---

# Segurança dos Contentores

Para os contentores Docker deverão ser aplicadas as seguintes medidas:

- Utilizar imagens oficiais ou verificadas.
- Atualizar imagens regularmente.
- Evitar execução como utilizador root.
- Reduzir privilégios ao mínimo necessário.
- Analisar vulnerabilidades periodicamente.

---

# Monitorização

Os eventos de segurança deverão ser monitorizados continuamente.

Exemplos:

- Tentativas de acesso inválidas.
- Alterações críticas.
- Erros repetitivos.
- Atividade suspeita.

---

# Backups

Os backups deverão ser:

- Regulares.
- Testados.
- Protegidos.
- Armazenados em local distinto da infraestrutura principal.

---

# Resposta a Incidentes

Sempre que ocorrer um incidente de segurança deverão ser seguidos os seguintes passos:

1. Identificação.
2. Contenção.
3. Erradicação.
4. Recuperação.
5. Análise pós-incidente.
6. Atualização da documentação.

---

# Boas Práticas

- Atualizar software regularmente.
- Minimizar superfícies de ataque.
- Utilizar palavras-passe fortes.
- Rever permissões periodicamente.
- Documentar todos os procedimentos de segurança.

---

# Conclusão

A segurança constitui um requisito essencial para a operação da plataforma OTJ, devendo estar integrada em todas as fases do ciclo de vida do projeto.

---

**Fim do documento**
