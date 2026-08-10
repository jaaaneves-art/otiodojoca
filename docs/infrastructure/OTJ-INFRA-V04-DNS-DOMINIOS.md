# OTJ-INFRA-V04 — DNS e Domínios

**Código:** OTJ-INFRA-V04  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Infrastructure  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de gestão de domínios e do serviço DNS da plataforma O Tio do Joca (OTJ), garantindo disponibilidade, segurança e facilidade de administração.

---

# Domínios

A plataforma deverá utilizar um domínio principal e, quando necessário, subdomínios dedicados para os diferentes serviços.

Exemplos:

- www.otiodojoca.pt
- api.otiodojoca.pt
- admin.otiodojoca.pt
- docs.otiodojoca.pt

---

# Gestão DNS

Os registos DNS deverão ser geridos de forma centralizada e documentada.

Tipos de registos mais comuns:

- A
- AAAA
- CNAME
- MX
- TXT
- NS

---

# Requisitos

A configuração DNS deverá garantir:

- Elevada disponibilidade.
- Tempos de resposta reduzidos.
- Facilidade de atualização.
- Compatibilidade com IPv4 e IPv6, quando aplicável.

---

# Segurança

Aplicar as seguintes boas práticas:

- Proteger o acesso ao fornecedor DNS.
- Utilizar autenticação multifator (MFA).
- Restringir permissões administrativas.
- Rever periodicamente os registos.
- Ativar DNSSEC quando suportado.

---

# Boas Práticas

- Documentar todos os registos.
- Evitar registos obsoletos.
- Definir TTL adequados.
- Separar ambientes de produção e testes.
- Validar alterações antes da sua aplicação.

---

# Continuidade

Sempre que possível, deverá existir redundância nos serviços DNS para minimizar o impacto de falhas.

---

# Conclusão

Uma gestão adequada de DNS e domínios é essencial para garantir a disponibilidade, segurança e fiabilidade da infraestrutura da plataforma OTJ.

---

**Fim do documento**
