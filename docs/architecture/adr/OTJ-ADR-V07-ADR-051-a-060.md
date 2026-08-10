# OTJ — ADR (51–60)

## ADR-051 — Data Lake
**Estado:** Aceite

### Decisão
A plataforma disponibilizará um Data Lake para armazenamento de dados brutos provenientes de múltiplas fontes.

### Consequências
- preservação dos dados originais
- suporte a análises futuras

---

## ADR-052 — Data Warehouse
**Estado:** Aceite

### Decisão
Os dados analíticos serão consolidados num Data Warehouse otimizado para reporting e BI.

### Consequências
- consultas rápidas
- indicadores consistentes

---

## ADR-053 — ETL / ELT
**Estado:** Aceite

### Decisão
Os processos de ingestão de dados utilizarão pipelines ETL ou ELT conforme o cenário.

### Consequências
- integração simplificada
- maior qualidade dos dados

---

## ADR-054 — Dados Geoespaciais (GIS)
**Estado:** Aceite

### Decisão
A plataforma suportará informação geográfica através de extensões GIS.

### Consequências
- mapas e análises espaciais
- suporte a agricultura e território

---

## ADR-055 — Versionamento de Dados
**Estado:** Aceite

### Decisão
Os conjuntos de dados críticos terão controlo de versões.

### Consequências
- rastreabilidade
- recuperação de versões anteriores

---

## ADR-056 — Qualidade dos Dados
**Estado:** Aceite

### Decisão
Serão definidos controlos automáticos de qualidade dos dados.

### Consequências
- maior fiabilidade
- redução de erros

---

## ADR-057 — Catálogo de Dados
**Estado:** Aceite

### Decisão
Todos os ativos de dados serão registados num catálogo central.

### Consequências
- descoberta facilitada
- melhor governação

---

## ADR-058 — Gestão de Metadados
**Estado:** Aceite

### Decisão
Os metadados serão geridos de forma centralizada e normalizada.

### Consequências
- consistência
- melhor documentação

---

## ADR-059 — Dados Abertos
**Estado:** Aceite

### Decisão
Os dados públicos serão disponibilizados através de APIs e formatos abertos.

### Consequências
- transparência
- reutilização por terceiros

---

## ADR-060 — Master Data Management (MDM)
**Estado:** Aceite

### Decisão
As entidades principais serão geridas através de princípios de Master Data Management.

### Consequências
- eliminação de duplicados
- fonte única de verdade
