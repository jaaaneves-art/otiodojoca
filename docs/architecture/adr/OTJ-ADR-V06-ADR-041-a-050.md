# OTJ — ADR (41–50)

## ADR-041 — Arquitetura de Inteligência Artificial
**Estado:** Aceite

### Decisão
A plataforma adotará uma arquitetura de IA desacoplada dos restantes serviços, permitindo evolução independente.

### Consequências
- flexibilidade
- escalabilidade

---

## ADR-042 — Agentes Especializados
**Estado:** Aceite

### Decisão
As funcionalidades de IA serão distribuídas por agentes especializados por domínio.

### Consequências
- maior precisão
- manutenção simplificada

---

## ADR-043 — RAG (Retrieval-Augmented Generation)
**Estado:** Aceite

### Decisão
As respostas da IA deverão privilegiar conhecimento documental validado através de RAG.

### Consequências
- menor alucinação
- maior confiança

---

## ADR-044 — Base de Conhecimento

### Decisão
Todo o conhecimento institucional será armazenado numa base de conhecimento versionada.

### Consequências
- reutilização
- consistência

---

## ADR-045 — Gestão de Prompts

### Decisão
Os prompts serão versionados, documentados e testados.

### Consequências
- previsibilidade
- facilidade de evolução

---

## ADR-046 — Model Context Protocol (MCP)

### Decisão
As integrações entre IA e ferramentas seguirão o Model Context Protocol sempre que aplicável.

### Consequências
- interoperabilidade
- menor dependência tecnológica

---

## ADR-047 — Estratégia Multi-Modelo

### Decisão
A plataforma poderá utilizar diferentes modelos de IA conforme o caso de utilização.

### Consequências
- otimização de custos
- melhor qualidade

---

## ADR-048 — Memória dos Agentes

### Decisão
A memória persistente será separada da lógica dos agentes.

### Consequências
- maior controlo
- auditoria simplificada

---

## ADR-049 — Supervisão Humana

### Decisão
As decisões críticas assistidas por IA deverão permitir validação humana.

### Consequências
- maior segurança
- redução de riscos

---

## ADR-050 — Ética e Utilização Responsável

### Decisão
A IA deverá respeitar princípios de transparência, privacidade e utilização responsável.

### Consequências
- confiança
- conformidade
