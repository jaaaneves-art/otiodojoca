# OTJ-DEVOPS-V10 — Backups

**Código:** OTJ-DEVOPS-V10  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a política de backups do projeto O Tio do Joca (OTJ), assegurando a proteção dos dados e a capacidade de recuperação da plataforma em caso de falha, erro humano ou incidente de segurança.

---

# Objetivos da Política de Backups

- Proteger a informação crítica.
- Minimizar a perda de dados.
- Permitir recuperação rápida.
- Cumprir boas práticas de continuidade de serviço.

---

# Âmbito

Devem ser efetuados backups de:

- Bases de dados.
- Ficheiros enviados pelos utilizadores.
- Configurações da infraestrutura.
- Variáveis de ambiente (armazenadas de forma segura).
- Scripts de automação.
- Documentação técnica.

---

# Tipos de Backups

## Backups completos

Incluem todos os dados do sistema e deverão ser realizados periodicamente.

## Backups incrementais

Guardam apenas as alterações desde o último backup, reduzindo espaço e tempo de execução.

## Backups diferenciais

Guardam as alterações desde o último backup completo.

---

# Frequência Recomendada

| Tipo | Frequência |
|------|------------|
| Base de dados | Diária |
| Ficheiros | Diária |
| Configuração | Sempre que existirem alterações |
| Documentação | Após alterações relevantes |
| Backup completo | Semanal |

A frequência poderá ser ajustada conforme a evolução do projeto.

---

# Armazenamento

Os backups deverão:

- Ser armazenados em localização distinta da infraestrutura principal.
- Estar protegidos contra acesso não autorizado.
- Ser cifrados sempre que contenham dados sensíveis.
- Possuir retenção definida.

---

# Testes de Recuperação

A existência de backups não é suficiente.

Devem ser realizados testes periódicos para confirmar:

- Integridade.
- Legibilidade.
- Tempo de recuperação.
- Funcionamento dos procedimentos.

---

# Automatização

Sempre que possível, os backups deverão ser executados automaticamente através de tarefas agendadas ou pipelines.

Os resultados deverão ser registados e monitorizados.

---

# Boas Práticas

- Automatizar o processo.
- Monitorizar falhas.
- Verificar espaço disponível.
- Testar recuperações regularmente.
- Documentar todos os procedimentos.

---

# Conclusão

Uma estratégia de backups bem definida reduz significativamente o impacto de falhas e constitui um elemento essencial da continuidade operacional do projeto OTJ.

---

**Fim do documento**
