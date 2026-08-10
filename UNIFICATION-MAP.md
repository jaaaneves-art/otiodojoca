# Mapeamento de Unificação — OPF vs OTJ

## Propósito
Documento que descreve como os campos do modelo **minimal (OPF)** mapeiam para o modelo **detalhado (OTJ)**, permitindo unificação futura sem perda de dados.

---

## Campo por Campo

| OPF (Minimal) | OTJ (Detailed) | Mapeamento | Notas |
|---|---|---|---|
| `session-id` | `ID` | 1:1 | OPF usa timestamp (20260726T0836), OTJ usa número sequencial (004) |
| `timestamp` | `Data` + `Hora de início` | 1:1 | Mesmo valor, formatação diferente |
| `duração` (calculada) | `Duração` | 1:1 | Ambas calculam; OTJ é manual |
| `Próximo passo` | `Próxima sessão` → "Ponto de retoma" | 1:1 | Campo semântico equivalente |
| `Estado actual` | `Trabalho realizado` | 1:n | OPF: 4 categorias (Concluído/Curso/Bloqueado/Por fazer); OTJ: lista livre |
| `Decisões` | `Decisões tomadas` | 1:1 | Ambas append-only |
| (não existe) | `Estatísticas` | — | OPF não tem; OTJ regista componentes criados, commits, etc. |
| (não existe) | `Problemas encontrados` | — | OPF não tem seção explícita |
| (não existe) | `Soluções aplicadas` | — | OPF não tem seção explícita |
| `Tentado e rejeitado` | (não existe) | — | OPF tem; OTJ não regista explicitamente |
| `Armadilhas` | (não existe) | — | OPF tem; OTJ não regista explicitamente |

---

## Estratégia de Unificação Futura

### Opção 1: Formato Híbrido (Recomendado)
Criar um `UNIFIED-STATE.md` que suporte ambos os níveis:

```markdown
# Session

**ID:** (número sequencial único)
**Timestamp:** (ISO 8601)
**Duração:** (calculada automaticamente)
**Nível:** minimal | detailed

## Estado Actual
- Concluído: [...]
- Em curso: [...]

## Próximo Passo
(Obrigatório em ambos os níveis)

## Decisões
(Append-only, ambos os níveis)

---
## Detalhes (só nível detailed)

### Objetivo
(IA-2 preenche isto)

### Problemas Encontrados
(IA-2 regista)

### Soluções Aplicadas
(IA-2 regista)

### Estatísticas
(IA-2 preenche)

### Observações
(IA-2 preenche)
```

### Opção 2: Dois Ficheiros Sincronizados
Manter separado, mas com script que lê ambos e gera `STATE-CONSOLIDATED.md`.

---

## Campos Deriváveis (zero overhead)

Estes campos não precisam de ser duplicados; podem ser gerados automaticamente:

| Campo | Derivável de | Como |
|-------|--------------|------|
| `Duração` | Timestamp início + fim | `fim - início` |
| `Data` | Timestamp | Extrair data do carimbo |
| `Commits` | Git log entre sessões | `git log --oneline` |
| `Estado consolidado` | Todos os `Estado actual` de todas as IAs | Merge automático |

---

## Identificadores: Estratégia Futura

**Problema actual:**
- IA-1 usa: `20260726T0836` (timestamp)
- IA-2 usa: `004` (número sequencial)

**Solução proposta:**
Criar ID único global que incorpora ambos:
```
session-ia1-20260726T0836
session-ia2-004-20260726T1926
```

Ou, melhor:
```
session-001-ia1-20260726T0836
session-002-ia2-20260726T1926
session-003-ia1-20260726T0911
```

Contadores globais + referência de IA + timestamp = impossível colisão.

---

## Próximos Passos (quando unificar)

1. **Escolher formato** (Opção 1 ou 2 acima)
2. **Converter histórico** (todas as 5 sessões antigas para novo formato)
3. **Atualizar scripts** (`start-session.ps1`, `end-session.ps1`) para usar novo formato
4. **Validação**: Nenhum dado perdido, estrutura clara

**Esforço estimado:** 3-4 horas de desenvolvimento + testes.

---

## Referências

- OPF minimal: `.opf-ia1/` + `STATE.md`
- OTJ detailed: `docs/project-management/sessions/SESSION-*.md`
- Histórico: 5 sessões antigas em upload

---

**Documento criado em paralelo aos dois sistemas. Mantém-se aqui até unificação.**
