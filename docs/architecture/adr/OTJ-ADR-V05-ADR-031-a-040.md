# OTJ — ADR (31–40)

## ADR-031 — Continuidade de Negócio
**Estado:** Aceite

### Decisão
A plataforma deverá possuir um Plano de Continuidade de Negócio (BCP), garantindo a manutenção dos serviços críticos perante incidentes.

### Consequências
- maior resiliência
- menor indisponibilidade

---

## ADR-032 — Recuperação de Desastre
**Estado:** Aceite

### Decisão
Será implementado um Plano de Disaster Recovery (DRP), com cópias de segurança e procedimentos de recuperação testados regularmente.

### Consequências
- recuperação rápida
- menor perda de dados

---

## ADR-033 — Política de Backups
**Estado:** Aceite

### Decisão
Todos os dados críticos terão backups automáticos, versionados e armazenados em local distinto.

### Consequências
- proteção contra perda de informação
- recuperação simplificada

---

## ADR-034 — Governança Arquitetural
**Estado:** Aceite

### Decisão
Todas as alterações arquiteturais relevantes deverão ser registadas através de ADR.

### Consequências
- histórico de decisões
- maior consistência

---

## ADR-035 — Gestão do Ciclo de Vida dos Dados
**Estado:** Aceite

### Decisão
Os dados terão políticas de retenção, arquivo e eliminação definidas.

### Consequências
- conformidade legal
- melhor gestão do armazenamento

---

## ADR-036 — Conformidade RGPD
**Estado:** Aceite

### Decisão
A arquitetura será concebida segundo os princípios do RGPD e Privacy by Design.

### Consequências
- maior proteção da privacidade
- cumprimento regulamentar

---

## ADR-037 — Auditoria Completa
**Estado:** Aceite

### Decisão
Todas as operações sensíveis serão registadas em logs de auditoria imutáveis.

### Consequências
- rastreabilidade
- apoio à investigação de incidentes

---

## ADR-038 — Padrões de Integração
**Estado:** Aceite

### Decisão
As integrações externas utilizarão APIs normalizadas e contratos bem definidos.

### Consequências
- menor acoplamento
- facilidade de evolução

---

## ADR-039 — Gestão de Dependências
**Estado:** Aceite

### Decisão
As dependências de software serão monitorizadas e atualizadas regularmente.

### Consequências
- redução de vulnerabilidades
- maior estabilidade

---

## ADR-040 — Revisão Arquitetural Contínua
**Estado:** Aceite

### Decisão
A arquitetura será revista periodicamente para acompanhar a evolução tecnológica e do negócio.

### Consequências
- arquitetura sustentável
- melhoria contínua
