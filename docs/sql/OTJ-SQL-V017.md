# OTJ-SQL-V17 — Funções e Triggers

## Objetivo

Este documento define a estratégia de implementação de **Funções** (*Functions*) e **Triggers** na Base de Dados da plataforma **O Tio do Joca (OTJ)**.

A utilização destes mecanismos permite automatizar operações, garantir a integridade dos dados e centralizar regras de negócio diretamente na Base de Dados.

---

# Princípios

A implementação deverá garantir:

- Automatização de processos
- Consistência dos dados
- Reutilização de lógica
- Segurança
- Facilidade de manutenção
- Escalabilidade

---

# Funções

As funções deverão ser utilizadas para:

- Validação de dados
- Processamento de informação
- Cálculos
- Geração automática de valores
- Apoio às políticas RLS
- Operações reutilizáveis

Sempre que possível, deverão ser pequenas, bem documentadas e reutilizáveis.

---

# Triggers

As *Triggers* poderão executar automaticamente ações quando ocorrerem operações sobre as tabelas.

Eventos suportados:

- BEFORE INSERT
- AFTER INSERT
- BEFORE UPDATE
- AFTER UPDATE
- BEFORE DELETE
- AFTER DELETE

---

# Exemplos de Utilização

As funções e *triggers* poderão ser utilizadas para:

- Atualização automática do campo `updated_at`
- Registo de auditoria
- Validação de regras de negócio
- Criação automática de perfis de utilizador
- Atualização de contadores
- Sincronização de dados
- Registo de histórico
- Geração de notificações internas

---

# Auditoria

Sempre que aplicável, as *triggers* poderão criar registos automáticos de:

- Criação
- Alteração
- Eliminação
- Aprovação
- Publicação

Permitindo manter um histórico consistente das operações realizadas.

---

# Desempenho

A utilização de funções e *triggers* deverá ser cuidadosamente avaliada para evitar impacto negativo no desempenho da Base de Dados.

Sempre que possível, a lógica deverá ser simples, eficiente e devidamente otimizada.

---

# Segurança

As funções deverão respeitar:

- Papéis de utilizador
- Permissões
- Políticas RLS
- Validação de acessos

Não deverão permitir operações que contornem os mecanismos de segurança da plataforma.

---

# Manutenção

Todas as funções e *triggers* deverão:

- Ser documentadas
- Possuir nomenclatura consistente
- Ser versionadas
- Ser testadas após alterações estruturais

---

# Escalabilidade

A arquitetura deverá permitir adicionar novas funções e *triggers* sem comprometer a estabilidade da Base de Dados, acompanhando a evolução funcional da plataforma OTJ.

---

# Conclusão

A utilização de funções e *triggers* permite automatizar processos críticos da plataforma OTJ, reforçando a integridade da informação, reduzindo tarefas repetitivas e centralizando regras de negócio diretamente na Base de Dados.