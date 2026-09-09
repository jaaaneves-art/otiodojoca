# Pendente — Aplicar a reorganização da documentação

**Data**: 07/09/2026 às 11:30
**Prioridade: baixa — não bloqueia código.**

---

## Estado

Pacote pronto (`INSTALAR.sh` + árvore `docs/`). **Por aplicar ao repositório.**

```bash
cd ~/Nextcloud/Projectos/otiodojoca
/caminho/para/INSTALAR.sh
git status && git diff --stat
```

O script não sobrescreve nada: ficheiros iguais são ignorados, ficheiros com
conteúdo diferente são listados no fim para decidires à mão.

## Estrutura criada

```
docs/
├── sessions/     registo do que foi feito (30 ficheiros)
├── pendentes/    trabalho em aberto (+ _arquivo/ para resolvidos)
├── decisoes/     decisões de produto/arquitetura (7)
├── estudos/      análises técnicas (2)
├── guias/        procedimentos e convenções (3)
└── _templates/   SESSION-TEMPLATE.md
```

## A pasta `claude/`

Depois de confirmar que a cópia correu, decidir o que fazer à pasta `claude/`
original. Os ficheiros foram **copiados**, não movidos — neste momento existem
em dois sítios, e duas cópias divergem mais cedo ou mais tarde.

## Duas decisões de convenção

### Numeração de sessões

Está partida. Existem `SESSION-004` e `SESSION-007`; faltam 001–003, 005 e 006.
Uma ficou `SESSION--202607202234.md` (duplo hífen) por o número nunca ter sido
preenchido. Em agosto o template foi abandonado e passaste a relatórios livres.

Ou se retoma a numeração, ou se assume o formato livre com
`ASSUNTO-YYYYMMDD.md`. O meio-termo atual custa a navegar. A sessão de hoje foi
gravada no formato livre.

### `PHASE*` vs `FASE*`

São sequências **diferentes** com nomes colididos. Existem três "fase 7" sem
relação entre si: Alojamento/Next.js, Culturas e Módulo Social. Prefixar por
módulo (`ALOJAMENTO-FASE7`, `CULTURAS-FASE7`) resolvia, mas implica renomear
ficheiros já referenciados por outros documentos — fazer de uma vez ou não fazer.

## `CONVENCOES-MARKDOWN.md`

Era `claude/INSTRUCOES-CLAUDE.md`. Se houver um `CLAUDE.md` na raiz do
repositório, fundir os dois — instruções em dois sítios divergem.
