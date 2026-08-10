# OTJ — ADR (11–20)

## ADR-011 — Arquitetura Modular
**Estado:** Aceite

### Contexto
O sistema irá crescer continuamente, incorporando novos módulos (Agricultura, Pecuária, Turismo, Municípios, Marketplace, Meteorologia, etc.). Sem modularidade o projeto tornar-se-á difícil de manter.

### Decisão
Toda a plataforma será organizada em módulos independentes.

Cada módulo possuirá:
- domínio
- serviços
- API
- testes
- documentação

### Consequências

**Positivas**
- manutenção simples
- menor acoplamento
- equipas independentes
- escalabilidade

**Negativas**
- maior organização inicial

---

## ADR-012 — Clean Architecture
**Estado:** Aceite

### Contexto
Pretende-se impedir que regras de negócio dependam de frameworks.

### Decisão
Será utilizada Clean Architecture.

Camadas:
- Domain
- Application
- Infrastructure
- API

### Consequências
- independência tecnológica
- facilidade de testes
- maior longevidade

---

## ADR-013 — API Stateless
**Estado:** Aceite

### Contexto
O backend deverá poder escalar horizontalmente.

### Decisão
A API será Stateless.

Todo o estado será armazenado em:
- JWT
- Base de Dados
- Cache

Nunca em memória do servidor.

### Consequências
- balanceamento simples
- múltiplos servidores

---

## ADR-014 — Versionamento da API
**Estado:** Aceite

### Contexto
A API irá evoluir.

### Decisão
Todas as versões serão prefixadas.

Exemplo:

```text
/api/v1
/api/v2
```

### Consequências
Compatibilidade entre clientes.

---

## ADR-015 — UUID como Identificador
**Estado:** Aceite

### Contexto
IDs sequenciais revelam informação.

### Decisão
Todas as entidades utilizarão UUID.

### Consequências

**Vantagens**
- segurança
- distribuição
- replicação

---

## ADR-016 — Logs Centralizados
**Estado:** Aceite

### Contexto
A plataforma irá gerar milhares de eventos.

### Decisão
Todos os logs serão centralizados.

Tipos:
- aplicação
- auditoria
- segurança
- performance

### Consequências
Facilidade de investigação.

---

## ADR-017 — Feature Flags
**Estado:** Aceite

### Contexto
Será necessário ativar funcionalidades gradualmente.

### Decisão
As novas funcionalidades serão protegidas por Feature Flags.

### Consequências
- menor risco
- rollback imediato

---

## ADR-018 — Configuração por Ambiente
**Estado:** Aceite

### Contexto
Existem vários ambientes:
- Desenvolvimento
- Testes
- Staging
- Produção

### Decisão
Toda a configuração será feita através de variáveis de ambiente.

Nunca código.

### Consequências
Maior segurança.

---

## ADR-019 — Documentação Obrigatória
**Estado:** Aceite

### Contexto
Todo o código deverá ser compreensível anos depois.

### Decisão
Cada módulo deverá possuir documentação mínima, incluindo:
- README
- API
- decisões
- exemplos

### Consequências
Melhor manutenção.

---

## ADR-020 — Evolução sem Quebra
**Estado:** Aceite

### Contexto
A plataforma deverá funcionar durante décadas.

### Decisão
Toda alteração incompatível deverá:
- criar nova versão
- manter compatibilidade
- possuir plano de migração

### Consequências
Atualizações seguras e controladas.
