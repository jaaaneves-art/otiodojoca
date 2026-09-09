# Pendente — Reescrever o Módulo Educação sobre a camada de adesões

**Data**: 07/09/2026 às 11:30
**Prioridade: média — depende de `ADESOES-EXECUTAR-SQL-20260907.md` estar feito.**

---

## Porquê

Os ficheiros do Módulo Educação foram escritos no início da sessão de 07/09,
**antes** da correção que introduziu a camada genérica de adesões. Parte deles
está superada.

| Ficheiro | Estado |
|---|---|
| `MODULO_EDUCACAO_DESIGN.md` | Secções de entidades válidas; secções de pessoas/vinculações superadas |
| `OTJ-SQL-EDUCACAO-V001.sql` | **Não executar como está** |
| `lib/educacao/types.ts` | Reescrever a parte de pessoas |
| `lib/educacao/actions.ts` | Reescrever a parte de vinculações |

## O que cai

- **`pessoas_educacao`** — a identidade passa a ser `profiles`. Não é preciso
  uma tabela de pessoas por módulo; era exatamente o problema que a decisão de
  camada genérica resolveu.
- **`vinculacoes_educacao`** — substituída por `adesoes`.
- **`entidades_educacao.owner_id`** — substituído por `grupos_moderadores`.

## O que fica

As quatro tabelas de entidades — `escolas`, `agrupamentos_escolares`,
`infantarios`, `associacoes_estudantes`. Continuam a fazer sentido: guardam o
que é específico de cada tipo (ciclos de ensino, idades atendidas, código de
escola da DGEEC) e isso não tem lugar numa tabela genérica.

Passam a ter `grupo_id uuid NOT NULL UNIQUE REFERENCES grupos(id)`.

## O que fica por decidir

**Perfis estendidos.** `professores_perfil`, `profissionais_perfil`,
`estudantes_perfil` — ficam por módulo, ou passam a `jsonb` em
`adesoes.dados_adicionais`?

Argumento para tabelas: são consultáveis e validáveis. Um filtro "professores de
Matemática no concelho X" com `jsonb` fica mau.

Argumento para `jsonb`: o campo já existe, e um professor pode ter perfis
diferentes em escolas diferentes (disciplinas distintas em cada uma) — o que
uma tabela por pessoa não representa.

Provavelmente os dois: o que é da **pessoa** (formação académica, certificações)
numa tabela; o que é da **adesão** (disciplinas que dá *naquela* escola, ano de
frequência *naquela* turma) em `dados_adicionais`.

Decidir antes de escrever SQL.

## Papéis por tipo de grupo

`grupos.papeis_permitidos` tem de ser preenchido na criação. Proposta inicial:

| Tipo de grupo | Papéis |
|---|---|
| `escola` | professor, profissional, estudante, encarregado |
| `agrupamento` | professor, profissional, direcao |
| `infantario` | educador, profissional, encarregado |
| `associacao` | membro, direcao |

Por confirmar com o Yos. Um papel escrito à mão que não esteja na lista faz o
trigger `adesao_before_insert` rejeitar a adesão — o que é o comportamento
desejado, mas obriga a acertar a lista primeiro.

## Ordem de trabalho

1. `ADESOES-EXECUTAR-SQL-20260907.md` feito e testado
2. Decidir perfis estendidos (tabela vs. `dados_adicionais`)
3. Confirmar `papeis_permitidos` por tipo
4. Reescrever `OTJ-SQL-EDUCACAO-V001.sql` sobre `grupos`
5. `lib/educacao/types.ts` e `actions.ts`
6. Frontend — nada começado
