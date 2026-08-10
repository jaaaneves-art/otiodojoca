# OTJ-INFRA-V10 — Monitorização da Infraestrutura

**Código:** OTJ-INFRA-V10  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Infrastructure  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de monitorização da infraestrutura do projeto O Tio do Joca (OTJ), garantindo a deteção precoce de problemas, elevada disponibilidade dos serviços e suporte à melhoria contínua.

---

# Objetivos

- Monitorizar continuamente a infraestrutura.
- Detetar falhas rapidamente.
- Medir o desempenho dos serviços.
- Apoiar a resolução de incidentes.
- Recolher métricas para planeamento de capacidade.

---

# Componentes a Monitorizar

- Servidores
- Rede
- Reverse Proxy
- Frontend
- Backend
- Base de dados
- Armazenamento
- Certificados SSL/TLS
- Backups

---

# Métricas

As principais métricas incluem:

- Utilização de CPU
- Memória RAM
- Espaço em disco
- Latência
- Tráfego de rede
- Tempo de resposta
- Disponibilidade dos serviços
- Número de erros

---

# Alertas

Deverão existir alertas automáticos para:

- Serviços indisponíveis.
- CPU ou memória acima dos limites definidos.
- Espaço em disco reduzido.
- Certificados próximos da expiração.
- Falhas de backups.
- Erros repetitivos.

---

# Ferramentas

Poderão ser utilizadas soluções como:

- Prometheus
- Grafana
- Uptime Kuma
- Ferramentas de monitorização do fornecedor cloud

---

# Boas Práticas

- Definir limiares adequados.
- Evitar excesso de alertas.
- Rever métricas periodicamente.
- Integrar monitorização com logs.
- Documentar procedimentos de resposta.

---

# Conclusão

Uma monitorização eficaz permite manter a infraestrutura OTJ disponível, segura e preparada para responder ao crescimento da plataforma.

---

**Fim do documento**
