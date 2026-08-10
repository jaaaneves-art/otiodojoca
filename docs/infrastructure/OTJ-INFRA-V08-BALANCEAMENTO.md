# OTJ-INFRA-V08 — Balanceamento de Carga

**Código:** OTJ-INFRA-V08  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Infrastructure  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de balanceamento de carga da infraestrutura do projeto O Tio do Joca (OTJ), garantindo elevada disponibilidade, distribuição eficiente do tráfego e capacidade de crescimento da plataforma.

---

# Conceito

O balanceamento de carga consiste na distribuição automática dos pedidos recebidos entre múltiplas instâncias de um mesmo serviço, evitando sobrecargas e melhorando o desempenho global.

---

# Objetivos

- Distribuir o tráfego de forma equilibrada.
- Aumentar a disponibilidade.
- Melhorar o desempenho.
- Facilitar a escalabilidade horizontal.
- Reduzir pontos únicos de falha.

---

# Cenários de Utilização

O balanceamento poderá ser aplicado a:

- Frontend
- Backend/API
- Serviços de autenticação
- Outros serviços críticos

---

# Algoritmos

Os algoritmos mais comuns incluem:

- Round Robin
- Least Connections
- IP Hash
- Weighted Round Robin

A escolha dependerá das características da infraestrutura.

---

# Monitorização

O balanceador deverá monitorizar o estado das instâncias e remover automaticamente do serviço aquelas que não estejam operacionais.

---

# Segurança

O balanceador deverá:

- Integrar-se com HTTPS.
- Trabalhar em conjunto com o Reverse Proxy.
- Registar eventos relevantes.
- Aplicar limites de pedidos quando necessário.

---

# Boas Práticas

- Configurar verificações de saúde (Health Checks).
- Documentar a configuração.
- Testar cenários de falha.
- Rever periodicamente a distribuição de carga.
- Preparar a infraestrutura para crescimento futuro.

---

# Conclusão

O balanceamento de carga constitui um elemento essencial para garantir disponibilidade, desempenho e escalabilidade da plataforma OTJ à medida que o número de utilizadores aumenta.

---

**Fim do documento**
