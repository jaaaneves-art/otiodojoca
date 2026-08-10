# OTJ — ADR (81–90)

## ADR-081 — Arquitetura Zero Trust
**Estado:** Aceite

### Decisão
Adotar o princípio Zero Trust: nenhum utilizador, dispositivo ou serviço é considerado confiável por defeito.

### Consequências
- maior proteção
- redução da superfície de ataque

---

## ADR-082 — Gestão de Segredos
**Estado:** Aceite

### Decisão
Credenciais, chaves e tokens serão armazenados num cofre de segredos dedicado.

### Consequências
- maior segurança
- rotação simplificada

---

## ADR-083 — Criptografia
**Estado:** Aceite

### Decisão
Os dados serão cifrados em trânsito e em repouso utilizando algoritmos reconhecidos.

### Consequências
- confidencialidade
- conformidade

---

## ADR-084 — Gestão de Chaves
**Estado:** Aceite

### Decisão
As chaves criptográficas terão ciclo de vida controlado, incluindo rotação e revogação.

### Consequências
- menor risco
- gestão centralizada

---

## ADR-085 — PKI
**Estado:** Aceite

### Decisão
Os certificados digitais seguirão uma Infraestrutura de Chave Pública (PKI).

### Consequências
- autenticação forte
- comunicações seguras

---

## ADR-086 — SIEM
**Estado:** Aceite

### Decisão
Os eventos de segurança serão agregados numa plataforma SIEM.

### Consequências
- deteção de ameaças
- correlação de eventos

---

## ADR-087 — Resposta a Incidentes
**Estado:** Aceite

### Decisão
Existirão procedimentos documentados para resposta e recuperação de incidentes de segurança.

### Consequências
- resposta rápida
- redução do impacto

---

## ADR-088 — Testes de Penetração
**Estado:** Aceite

### Decisão
Serão realizados testes de penetração periódicos antes de grandes lançamentos.

### Consequências
- identificação de vulnerabilidades
- melhoria contínua

---

## ADR-089 — Gestão de Vulnerabilidades
**Estado:** Aceite

### Decisão
As vulnerabilidades serão identificadas, classificadas e corrigidas segundo níveis de criticidade.

### Consequências
- menor exposição
- priorização eficaz

---

## ADR-090 — Security by Design
**Estado:** Aceite

### Decisão
A segurança será considerada desde a fase de conceção de todas as funcionalidades.

### Consequências
- menor custo de correção
- software mais seguro
