# Dois Modelos de Rastreamento — OPF vs OTJ

## Sumário

Este projecto usa **dois modelos de sessão em paralelo**, optimizados para diferentes tipos de trabalho:

- **OPF (Minimal)** — para trabalho rápido, focado, minimalista
- **OTJ (Detailed)** — para trabalho documentado, com estatísticas e análise profunda

Ambos funcionam independentemente. Unificação está documentada em `UNIFICATION-MAP.md`.

---

## Modelo 1: OPF (Minimal)

**Localização:** `.opf-ia1/`

**Quem usa:** IA trabalhando em tarefas técnicas de desenvolvimento, refactor, correções.

**O que regista:**

```
STATE.md
├── Objectivo (imutável, definido uma vez)
├── Estado actual (Concluído / Em curso / Bloqueado / Por fazer)
├── Próximo passo (uma acção única, imperativa)
├── Decisões (append-only)
├── Tentado e rejeitado (aprendizagens negativas)
└── Armadilhas (coisas que já causaram perda de tempo)

JOURNAL.md
└── Uma linha por sessão: ID | Início | Fim | Duração | Resumo

sessions/<id>.md
└── Detalhe: início, fim, duração, o que ficou feito, próximo passo
```

**Filosofia:** Mínimo essencial. A IA lê apenas `STATE.md` e sabe tudo o que precisa para retomar.

**Exemplo de sessão:**
```
Sessão: 20260726T0836
Duração: 34 minutos
Resumo: Limpeza estrutural: removidos segredos, configs duplicados resolvidos

Próximo passo: Preencher o Objectivo do STATE.md
```

---

## Modelo 2: OTJ (Detailed)

**Localização:** `docs/project-management/sessions/SESSION-*.md`

**Quem usa:** IA trabalhando em documentação, architecture, análise profunda.

**O que regista:**

```
SESSION-*.md
├── Identificação (número sequencial + timestamp + duração)
├── Objectivos (o que se pretendia alcançar)
├── Trabalho realizado (itemizado)
├── Estatísticas (componentes criados, commits, erros resolvidos)
├── Decisões tomadas (com contexto)
├── Problemas encontrados (específicos)
├── Soluções aplicadas (específicas)
├── Estado do Projecto (visão global)
├── Próxima sessão (ponto de retoma + checklist)
└── Observações (reflexão)
```

**Filosofia:** Documentação profissional. Rastreamento detalhado para auditoria e aprendizagem.

**Exemplo de sessão:**
```
Sessão 004
ID: SESSION-004-202607161935
Duração: 2h00m

Objectivos:
- Melhorar a arquitetura do módulo Perfil
- Iniciar Profile V2

Trabalho realizado:
- Criação de 10 novos componentes
- Reorganização de 6 componentes
- Resolução de 4 erros
- 1 commit realizado

Estatísticas:
- Novos componentes: 10
- Componentes reorganizados: 6
- Erros resolvidos: 4

Próxima sessão:
- Continuar Perfil V2
- Melhorar interface
- Implementar Editar Perfil
```

---

## Quando Usar Cada Um

| Situação | Modelo | Razão |
|----------|--------|-------|
| Implementar feature, corrigir bug, refactor | **OPF** | Rápido, sem overhead |
| Arquitectura, documentação, análise | **OTJ** | Contexto e detalhe |
| Trabalho paralelo de múltiplas IAs | **OPF** | Isolamento limpo, sem conflitos |
| Revisão histórica, auditoria, lições aprendidas | **OTJ** | Riqueza de detalhes |
| IA nova chega e precisa contexto | **OPF** | `STATE.md` tem o essencial |
| Precisa demonstrar progresso | **OTJ** | Estatísticas e documentação |

---

## Sincronização Entre Modelos

**Hoje:** Independentes. Sem sincronização automática.

**Próximo passo (se necessário):** Ver `UNIFICATION-MAP.md` para estratégia de merge.

**Mapeamento rápido:**
- OPF "Próximo passo" ← OTJ "Ponto de retoma"
- OPF "Decisões" ← OTJ "Decisões tomadas"
- OPF "Estado actual" ← OTJ "Trabalho realizado"

---

## Para uma IA Chegar Nova

1. **Se trabalho técnico rápido:** Use OPF. Corra `.\Sess\scripts\start-session.ps1 -Context ia3`

2. **Se trabalho documentado:** Use OTJ. Siga o template em `docs/project-management/sessions/SESSION-TEMPLATE.md`

3. **Em ambos os casos:** Leia o `STATE.md` (OPF) primeiro para entender o contexto global.

---

## Checklists de Início

### IA usando OPF (Minimal)
```
1. Ler .opf-ia*/STATE.md
2. Correr start-session.ps1 -Context ia<número>
3. Trabalhar
4. Correr end-session.ps1 -Context ia<número>
5. Responder: "O que ficou feito?" + "Próximo passo?"
```

### IA usando OTJ (Detailed)
```
1. Ler docs/project-management/sessions/ (últimas 3 sessões)
2. Criar novo ficheiro SESSION-NNN-AAAMMDDHHH.md
3. Preencher secções: Objectivos, Trabalho realizado, etc.
4. Registar decisões, problemas, soluções
5. Encerrar com "Próxima sessão" e checklist
```

---

## Estrutura de Pastas

```
projecto/
├── .opf-ia1/                          # OPF para IA-1
│   ├── STATE.md
│   ├── JOURNAL.md
│   └── sessions/

├── .opf-ia2/                          # OPF para IA-2 (se aplicável)
│   ├── STATE.md
│   ├── JOURNAL.md
│   └── sessions/

├── docs/project-management/sessions/  # OTJ para qualquer IA
│   ├── SESSION-001-*.md
│   ├── SESSION-002-*.md
│   └── SESSION-NNN-*.md

└── UNIFICATION-MAP.md                 # (este documento)
```

---

## Decisão de Design

**Por que dois modelos?**

- Diferentes tipos de trabalho requerem diferentes níveis de detalhe
- Forçar um formato único seria over-engineering ou sub-documentação
- Ambos podem coexistir e sincronizar depois se necessário

**Quando unificar?**

- Quando terceiros precisarem de uma visão consolidada
- Quando economia de contexto se torne crítica (3+ IAs em paralelo)
- Quando histórico total precisar de auditoria formal

Ver `UNIFICATION-MAP.md` para estratégia.

---

**Criado:** 26 de Julho de 2026  
**Versão:** 1.0 (Beta)  
**Status:** Experimental — sujeito a mudanças baseado em feedback
