# ARQUITETURA-DE-SERVICOS

## Objetivo

Definir a arquitetura dos serviços que suportam o ecossistema OTJ, as suas responsabilidades, interfaces e princípios de comunicação.

---

## Princípios

- Serviços independentes e coesos.
- Interfaces bem definidas.
- APIs versionadas.
- Baixo acoplamento.
- Elevada reutilização.
- Observabilidade e monitorização.

---

## Serviços Principais

### Serviços de Negócio
- Mercado da Terra
- Calendário Agrícola
- Biblioteca de Conhecimento
- Comunidade
- Gestão da Exploração

### Serviços Transversais
- Autenticação
- Autorização
- Notificações
- Pesquisa Global
- Inteligência Artificial
- Configuração

### Serviços de Infraestrutura
- Base de Dados
- Cache
- Armazenamento de Ficheiros
- Registo (Logging)
- Monitorização

---

## Comunicação

- REST API
- Eventos assíncronos quando aplicável
- Mensagens entre serviços através de interfaces estáveis

---

## Regras

- Cada serviço possui uma responsabilidade única.
- Os serviços não acedem diretamente aos dados internos de outros serviços.
- Toda a comunicação ocorre através de contratos públicos.

---

## Estado

Versão: 1.0

Estado: Em desenvolvimento.
