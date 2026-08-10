# OTJ-QA-V05 — Testes de Performance

**Código:** OTJ-QA-V05  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Qualidade e Testes (QA)  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de testes de performance do projeto O Tio do Joca (OTJ), garantindo que a plataforma responde de forma eficiente, estável e escalável sob diferentes níveis de carga.

---

# Conceito

Os testes de performance avaliam o comportamento da aplicação em condições normais e extremas de utilização, permitindo identificar limitações antes da entrada em produção.

---

# Objetivos

- Medir tempos de resposta.
- Avaliar estabilidade sob carga.
- Identificar estrangulamentos (bottlenecks).
- Validar a escalabilidade da plataforma.
- Apoiar o dimensionamento da infraestrutura.

---

# Tipos de Testes

## Testes de Carga

Verificam o desempenho esperado com o número normal de utilizadores.

## Testes de Stress

Avaliam o comportamento da aplicação acima da capacidade prevista.

## Testes de Resistência

Executam cargas prolongadas para detetar degradação ao longo do tempo.

## Testes de Pico

Simulam aumentos repentinos de utilizadores ou pedidos.

---

# Métricas

Durante os testes deverão ser recolhidas métricas como:

- Tempo médio de resposta.
- Tempo máximo de resposta.
- Número de pedidos por segundo.
- Utilização de CPU.
- Consumo de memória.
- Utilização da rede.
- Taxa de erros.

---

# Ambiente de Testes

Os testes deverão ser realizados num ambiente o mais semelhante possível ao de produção.

Sempre que possível, deverão ser utilizados dados representativos.

---

# Boas Práticas

- Definir objetivos mensuráveis.
- Automatizar a execução dos testes.
- Repetir os testes após alterações relevantes.
- Comparar resultados ao longo do tempo.
- Documentar todas as medições.

---

# Critérios de Aprovação

Uma versão poderá ser considerada adequada quando:

- Os tempos de resposta estiverem dentro dos limites definidos.
- Não existirem falhas críticas sob carga prevista.
- A infraestrutura responder de forma estável.

---

# Conclusão

Os testes de performance permitem garantir que a plataforma OTJ suporta o crescimento esperado, mantendo níveis adequados de desempenho e disponibilidade.

---

**Fim do documento**
