# OTJ-DEVOPS-V12 — Logs

**Código:** OTJ-DEVOPS-V12  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de gestão de logs do projeto O Tio do Joca (OTJ), garantindo o registo consistente dos eventos relevantes para operação, auditoria, diagnóstico e segurança.

---

# Objetivos

- Registar eventos importantes.
- Apoiar a resolução de incidentes.
- Facilitar auditorias.
- Melhorar a monitorização.
- Identificar problemas de desempenho.

---

# Tipos de Logs

## Sistema

- Arranque e encerramento.
- Utilização de recursos.
- Erros do sistema operativo.

## Aplicação

- Erros da aplicação.
- Operações relevantes.
- Exceções.
- Eventos críticos.

## Segurança

- Autenticações.
- Tentativas de acesso inválidas.
- Alterações de permissões.
- Eventos administrativos.

## Infraestrutura

- Reverse Proxy.
- Contentores Docker.
- Base de dados.
- Serviços externos.

---

# Boas Práticas

- Utilizar formato consistente.
- Incluir data e hora.
- Identificar origem do evento.
- Definir níveis de severidade.
- Evitar registar dados sensíveis.

---

# Níveis de Severidade

- DEBUG
- INFO
- WARNING
- ERROR
- CRITICAL

Cada nível deverá ser utilizado de forma coerente em toda a plataforma.

---

# Retenção

Os logs deverão possuir uma política de retenção adequada, considerando:

- Requisitos legais.
- Espaço disponível.
- Necessidades de auditoria.
- Custos de armazenamento.

---

# Centralização

Sempre que possível, os logs deverão ser centralizados para facilitar:

- Pesquisa.
- Correlação de eventos.
- Auditoria.
- Monitorização.

---

# Proteção

Os ficheiros de log deverão:

- Estar protegidos contra alterações não autorizadas.
- Ter acesso restrito.
- Ser incluídos nas políticas de backup quando aplicável.

---

# Conclusão

Uma gestão eficaz de logs melhora a observabilidade da plataforma OTJ, reduz o tempo de resolução de problemas e reforça a segurança operacional.

---

**Fim do documento**
