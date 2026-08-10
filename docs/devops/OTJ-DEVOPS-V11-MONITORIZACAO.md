# OTJ-DEVOPS-V11 — Monitorização

**Código:** OTJ-DEVOPS-V11  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de monitorização da infraestrutura, aplicações e serviços do projeto O Tio do Joca (OTJ), permitindo detetar problemas de forma precoce e garantir a disponibilidade da plataforma.

---

# Objetivos da Monitorização

- Garantir elevada disponibilidade.
- Identificar falhas rapidamente.
- Medir desempenho.
- Apoiar a resolução de incidentes.
- Recolher métricas para melhoria contínua.

---

# Componentes a Monitorizar

## Infraestrutura

- Utilização de CPU.
- Memória RAM.
- Espaço em disco.
- Rede.
- Estado dos servidores.

## Aplicações

- Frontend.
- Backend.
- APIs.
- Serviços de autenticação.

## Base de Dados

- Ligações ativas.
- Tempo de resposta.
- Utilização de recursos.
- Estado das réplicas (quando existirem).

---

# Métricas Recomendadas

- Tempo de resposta.
- Disponibilidade.
- Número de erros.
- Taxa de pedidos.
- Utilização de recursos.
- Número de utilizadores ativos.

---

# Alertas

Devem existir alertas automáticos para situações como:

- Serviço indisponível.
- Espaço em disco reduzido.
- Consumo excessivo de CPU.
- Falhas repetidas.
- Erros críticos da aplicação.

---

# Ferramentas

Poderão ser utilizadas ferramentas como:

- Grafana.
- Prometheus.
- Uptime Kuma.
- Serviços de monitorização do fornecedor cloud.

A escolha dependerá da evolução da infraestrutura.

---

# Boas Práticas

- Definir métricas relevantes.
- Evitar excesso de alertas.
- Rever limites periodicamente.
- Registar histórico de eventos.
- Integrar monitorização com logs.

---

# Benefícios

- Deteção precoce de problemas.
- Redução do tempo de indisponibilidade.
- Melhor capacidade de planeamento.
- Maior estabilidade operacional.

---

# Conclusão

Uma monitorização eficaz é essencial para assegurar a fiabilidade e a evolução sustentável da plataforma OTJ.

---

**Fim do documento**
