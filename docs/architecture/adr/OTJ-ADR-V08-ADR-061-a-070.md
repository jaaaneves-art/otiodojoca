# OTJ — ADR (61–70)

## ADR-061 — Observabilidade Avançada
**Estado:** Aceite

### Decisão
A plataforma implementará observabilidade com métricas, logs, tracing e dashboards centralizados.

### Consequências
- deteção proativa de problemas
- redução do MTTR

---

## ADR-062 — SLI, SLO e SLA
**Estado:** Aceite

### Decisão
Todos os serviços críticos terão indicadores (SLI), objetivos (SLO) e acordos de serviço (SLA).

### Consequências
- qualidade mensurável
- melhoria contínua

---

## ADR-063 — Gestão de Incidentes
**Estado:** Aceite

### Decisão
Os incidentes seguirão processos normalizados de classificação, resposta e pós-incidente.

### Consequências
- resposta consistente
- aprendizagem organizacional

---

## ADR-064 — Gestão de Alterações
**Estado:** Aceite

### Decisão
As alterações em produção serão controladas por processos formais de aprovação e validação.

### Consequências
- menor risco
- maior estabilidade

---

## ADR-065 — Gestão de Configuração
**Estado:** Aceite

### Decisão
Todas as configurações serão versionadas e geridas como código sempre que possível.

### Consequências
- rastreabilidade
- repetibilidade

---

## ADR-066 — Capacity Planning
**Estado:** Aceite

### Decisão
A capacidade da plataforma será monitorizada e revista regularmente.

### Consequências
- crescimento previsível
- prevenção de estrangulamentos

---

## ADR-067 — FinOps
**Estado:** Aceite

### Decisão
Os custos de infraestrutura serão monitorizados e otimizados continuamente.

### Consequências
- eficiência financeira
- melhor utilização dos recursos

---

## ADR-068 — Infraestrutura como Código (IaC)
**Estado:** Aceite

### Decisão
A infraestrutura será provisionada através de ferramentas de IaC.

### Consequências
- automatização
- consistência entre ambientes

---

## ADR-069 — Orquestração com Kubernetes
**Estado:** Aceite

### Decisão
Os serviços contentorizados serão orquestrados por Kubernetes ou solução equivalente.

### Consequências
- elevada disponibilidade
- escalabilidade

---

## ADR-070 — Operação Cloud-Native
**Estado:** Aceite

### Decisão
A arquitetura privilegiará princípios cloud-native para maximizar resiliência e elasticidade.

### Consequências
- melhor adaptação ao crescimento
- modernização tecnológica
