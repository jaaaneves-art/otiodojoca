# OTJ — ADR (21–30)

## ADR-021 — Observabilidade
**Estado:** Aceite

### Contexto
A plataforma deverá permitir monitorização contínua.

### Decisão
Implementar métricas, logs e tracing de forma integrada.

### Consequências
- deteção rápida de problemas
- melhor diagnóstico

---

## ADR-022 — Estratégia de Cache
**Estado:** Aceite

### Contexto
Alguns dados são consultados frequentemente.

### Decisão
Utilizar cache para conteúdos de leitura intensiva.

### Consequências
- menor carga na base de dados
- maior desempenho

---

## ADR-023 — Arquitetura Orientada a Eventos

**Estado:** Aceite

### Decisão
Operações assíncronas utilizarão eventos sempre que adequado.

### Consequências
- menor acoplamento
- maior escalabilidade

---

## ADR-024 — Serviço de Pesquisa

**Estado:** Aceite

### Decisão
A pesquisa será separada da base de dados operacional.

### Consequências
- pesquisas rápidas
- melhor relevância

---

## ADR-025 — Armazenamento de Ficheiros

**Estado:** Aceite

### Decisão
Ficheiros serão armazenados em object storage.

### Consequências
- elevada disponibilidade
- escalabilidade

---

## ADR-026 — CDN

**Estado:** Aceite

### Decisão
Conteúdos estáticos serão distribuídos através de CDN.

### Consequências
- menor latência
- menor carga no servidor

---

## ADR-027 — Integração com IA

**Estado:** Aceite

### Decisão
A IA será integrada através de serviços desacoplados.

### Consequências
- flexibilidade
- possibilidade de trocar modelos

---

## ADR-028 — Internacionalização (i18n)

**Estado:** Aceite

### Decisão
Todo o sistema suportará múltiplos idiomas desde a origem.

### Consequências
- expansão internacional
- manutenção simplificada

---

## ADR-029 — Multi-tenancy

**Estado:** Aceite

### Decisão
A arquitetura permitirá isolamento lógico entre organizações.

### Consequências
- reutilização da plataforma
- segurança entre entidades

---

## ADR-030 — Política de Depreciação

**Estado:** Aceite

### Decisão
Funcionalidades descontinuadas terão aviso prévio, período de transição e documentação de migração.

### Consequências
- atualizações previsíveis
- menor impacto nos utilizadores
