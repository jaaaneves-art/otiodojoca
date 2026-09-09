# Sessão — Módulo Educação e camada genérica de adesões

**Data**: 07/09/2026 às 11:30

**Âmbito:** desenho apenas. **Nenhum SQL foi executado contra a base de dados**,
nenhum ficheiro do repositório foi alterado. Tudo o que sai desta sessão são
ficheiros para rever antes de aplicar.

---

## 1. Ponto de partida

Pedido inicial: criar uma "caixa" para agrupamentos escolares, escolas,
associações de estudantes, infantários, professores e outras profissões das
escolas. Com formulários. "Os individuais são os normais."

Primeira proposta seguiu o padrão do Módulo Freguesia — entidades coletivas com
`owner_id`, e pessoas ligadas a uma instituição por convite do proprietário.

## 2. Correção do Yos que mudou o desenho

> "Podem fazer parte de qualquer grupo, associação, organização. Através do seu
> username pode fazer através de pedido ou ser convidado. Os moderadores é que
> fazem a sua aceitação. O convite pode ser feito com o email que terá a sua
> conversão no username."

Isto invalidou três pressupostos da primeira proposta:

| Pressuposto inicial | Realidade |
|---|---|
| O proprietário da entidade convida | **Moderadores** aceitam; pode haver vários |
| A vinculação é específica da Educação | Aplica-se a **qualquer** grupo, em qualquer módulo |
| A identidade é `pessoas_educacao.id` | A identidade é o **`profiles.username`** |

Só há convite→confirmação; passou a haver também **pedido** no sentido inverso
(a pessoa pede para entrar), o que exige `origem` na adesão.

## 3. Decisões confirmadas

Três perguntas colocadas, três respostas:

1. **A camada é genérica** — Educação, Escutismo, Universidades, Freguesia.
2. **Menores: dupla aprovação** — moderador *e* tutor.
3. **Convite por email a quem não tem conta** — cria convite pendente, converte no registo.

A decisão 1 fecha um ponto que estava em aberto há semanas: a unificação de
`pessoas_educacao` / `pessoas_universitarias`. Deixa de ser preciso — a tabela
partilhada é `profiles`, e o que é partilhado é a *adesão*, não a pessoa.

Detalhe em `docs/decisoes/DECISAO-ADESOES-GENERICAS-20260907.md`.

## 4. O que foi produzido

### `OTJ-SQL-ADESOES-V001.sql` — camada genérica de adesões

Seis tabelas: `grupos`, `grupos_moderadores`, `tutorias`, `adesoes`,
`adesoes_convites_email`, `config_plataforma`.

Pontos de desenho que valem registo:

- **Registo central `grupos` em vez de FK polimórfica.** Cada módulo aponta a
  sua tabela para `grupos.id`. A alternativa (`entidade_tipo` + `entidade_id`
  sem FK) não permite integridade referencial e acumula órfãos.
- **Toda a escrita passa por RPC.** `adesoes` não tem policy de INSERT/UPDATE.
  Sem isto, um cliente podia escrever `aprovado_moderador_em` à mão e
  auto-aprovar-se.
- **Helpers `SECURITY DEFINER`** (`e_moderador_grupo`, `e_tutor_confirmado_de`).
  As policies de `adesoes` consultam `grupos_moderadores` e vice-versa — sem o
  corte, é o ciclo de recursão que já deu deny-all silencioso duas vezes
  neste projeto.
- **Idade limite em `config_plataforma`**, não em código. A decisão 16 vs 18
  continua em aberto; ficou 18 provisório e muda-se com um UPDATE.
- **`e_menor()` falha para o lado seguro:** sem data de nascimento conhecida,
  assume menor. Uma aprovação de tutor a mais é preferível a inscrever um menor
  sem ela.
- **Token do convite guardado só em hash** (SHA-256); o valor em claro é
  devolvido uma única vez, para o email.
- **Column-level security** em `adesoes_convites_email`: `REVOKE` da tabela +
  `GRANT` por coluna, para `email_normalizado` e `token_hash` nunca saírem
  pelo PostgREST.

### Ficheiros do Módulo Educação (parcialmente superados)

`MODULO_EDUCACAO_DESIGN.md`, `OTJ-SQL-EDUCACAO-V001.sql`,
`lib/educacao/types.ts`, `lib/educacao/actions.ts`.

**Atenção:** foram escritos *antes* da correção da secção 2. A tabela
`vinculacoes_educacao` que lá está é substituída por `adesoes`. As tabelas de
entidades (`escolas`, `agrupamentos_escolares`, `infantarios`,
`associacoes_estudantes`) mantêm-se, mas passam a ter `grupo_id`.
Ver `docs/pendentes/EDUCACAO-REESCREVER-SOBRE-ADESOES-20260907.md`.

## 5. Arrumação da documentação

Classificados 52 ficheiros soltos. Descoberta relevante: a pasta `claude/`
continha três pendentes por identificar — `PHASE7-DIAGNOSTICO-FINAL`
(estado "BLOQUEADO", documento de handoff), `PHASE7-E2E-TESTING` (checklist de
passos por executar) e `PLANO-DIA-20260830` (prospetivo). Estavam arrumados
como se fossem relatórios fechados.

Dois pendentes já resolvidos foram para `docs/pendentes/_arquivo/`: Netuno
(resolvido 30/08) e JobNex (o próprio texto declara passar a histórico).

Criadas `docs/decisoes/`, `docs/estudos/` e `docs/guias/` — havia material
nessas três categorias que não é nem sessão nem pendente.

Ver `docs/pendentes/DOCS-REORGANIZACAO-20260907.md`.

## 6. Estado no fim da sessão

| Item | Estado |
|---|---|
| Camada de adesões — desenho | Fechado |
| Camada de adesões — SQL | Escrito, **por executar** |
| Módulo Educação — entidades | Desenhado, por reescrever sobre `grupos` |
| Módulo Educação — pessoas | Substituído pela camada de adesões |
| Frontend | Não começado |
| Reorganização de docs | Pacote pronto, **por aplicar** |

Nada foi para o repositório. Nenhuma migration correu.
