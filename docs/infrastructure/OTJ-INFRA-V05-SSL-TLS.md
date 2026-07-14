# OTJ-INFRA-V05 — SSL/TLS

**Código:** OTJ-INFRA-V05  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Infrastructure  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a política de utilização de certificados SSL/TLS na infraestrutura do projeto O Tio do Joca (OTJ), garantindo comunicações seguras entre utilizadores, serviços e sistemas.

---

# Conceito

SSL/TLS permite cifrar as comunicações entre clientes e servidores, protegendo a confidencialidade, integridade e autenticidade dos dados transmitidos.

---

# Requisitos

Toda a plataforma deverá utilizar HTTPS.

Os certificados deverão:

- Ser válidos.
- Estar atualizados.
- Utilizar algoritmos criptográficos modernos.
- Ser renovados antes da expiração.

---

# Âmbito

Os certificados deverão proteger:

- Website principal.
- API.
- Área administrativa.
- Subdomínios públicos.
- Serviços expostos na Internet.

---

# Gestão dos Certificados

A gestão deverá incluir:

- Inventário dos certificados.
- Datas de validade.
- Processo de renovação.
- Responsáveis pela administração.

Sempre que possível, a renovação deverá ser automatizada.

---

# Segurança

Aplicar as seguintes boas práticas:

- Desativar protocolos obsoletos.
- Utilizar versões atuais do TLS.
- Proteger as chaves privadas.
- Redirecionar HTTP para HTTPS.
- Ativar HSTS quando adequado.

---

# Monitorização

Devem ser monitorizados:

- Validade dos certificados.
- Erros TLS.
- Tentativas de ligação inseguras.
- Estado da renovação automática.

---

# Boas Práticas

- Utilizar certificados emitidos por autoridades reconhecidas.
- Evitar certificados expirados.
- Documentar alterações.
- Testar a configuração após renovações.

---

# Conclusão

A utilização correta de SSL/TLS constitui um requisito essencial para garantir a segurança das comunicações da plataforma OTJ e reforçar a confiança dos utilizadores.

---

**Fim do documento**
