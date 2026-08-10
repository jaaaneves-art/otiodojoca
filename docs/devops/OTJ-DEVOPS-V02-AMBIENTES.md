# OTJ-DEVOPS-V02 — Ambientes

**Código:** OTJ-DEVOPS-V02  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Este documento define os diferentes ambientes utilizados no projeto OTJ, a sua finalidade e as regras de utilização, garantindo um fluxo de desenvolvimento seguro e organizado.

---

# Princípios

Cada ambiente possui uma função específica e deve permanecer isolado dos restantes, evitando que alterações em desenvolvimento afetem os sistemas em produção.

---

# Ambientes do Projeto

## Desenvolvimento (Development)

Destina-se ao trabalho diário dos programadores.

Características:

- Ambiente local.
- Alterações frequentes.
- Testes iniciais.
- Dados de teste.
- Configuração flexível.

Objetivos:

- Desenvolver funcionalidades.
- Corrigir erros.
- Experimentar novas soluções.

---

## Testes (Testing)

Ambiente dedicado à validação técnica.

Características:

- Replica parcialmente a produção.
- Execução de testes automáticos.
- Testes de integração.
- Testes funcionais.

Objetivos:

- Confirmar estabilidade.
- Identificar regressões.
- Validar novas funcionalidades.

---

## Homologação (Staging)

Ambiente praticamente idêntico à produção.

Características:

- Configuração semelhante ao ambiente real.
- Utilização de versões candidatas.
- Testes finais antes do deploy.

Objetivos:

- Validação funcional.
- Aceitação pela equipa.
- Preparação para produção.

---

## Produção (Production)

Ambiente utilizado pelos utilizadores finais.

Características:

- Elevada disponibilidade.
- Segurança reforçada.
- Monitorização permanente.
- Backups automáticos.

Objetivos:

- Disponibilizar a plataforma.
- Garantir estabilidade.
- Assegurar desempenho.

---

# Fluxo entre ambientes

```text
Desenvolvimento
        │
        ▼
Testes
        │
        ▼
Homologação
        │
        ▼
Produção
```

Nenhuma alteração deverá ser promovida para o ambiente seguinte sem validação do anterior.

---

# Gestão de Configuração

Cada ambiente poderá possuir:

- Variáveis de ambiente próprias.
- Credenciais distintas.
- Bases de dados independentes.
- Serviços externos específicos.

Nunca deverão ser reutilizadas credenciais de produção em ambientes de desenvolvimento.

---

# Boas Práticas

- Separação total entre ambientes.
- Dados sensíveis protegidos.
- Automatização do aprovisionamento.
- Documentação atualizada.
- Controlo de versões consistente.

---

# Conclusão

A correta separação dos ambientes é essencial para garantir qualidade, segurança e previsibilidade durante todo o ciclo de vida do projeto OTJ.

---

**Fim do documento**
