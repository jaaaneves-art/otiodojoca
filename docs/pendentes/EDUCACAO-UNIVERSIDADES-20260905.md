# Pendentes — Educação v2.2 e Universidades v3.1

**Data:** 2026-09-05
**Origem:** auditoria em `claude_AUDITORIA-EDUCACAO-UNIVERSIDADES-20260905.md`
**Estado:** correcções escritas, **nada validado em execução**
**Máquina:** Linux Mint · `~/Nextcloud/Projectos/otiodojoca/` · branch a criar: `feature/educacao-universidades`

Este documento existe porque nada do que foi produzido nesta sessão pôde ser executado. A ordem abaixo é deliberada: cada fase só faz sentido depois da anterior fechar.

---

## Fase 0 — Antes de tocar em código (15 min)

```bash
cd ~/Nextcloud/Projectos/otiodojoca
git checkout -b feature/educacao-universidades
mkdir -p ~/Transferências/otj-educacao
# copiar os ficheiros descarregados para aí
```

- [ ] Backup do Supabase (`opdvusuwrhmbgkthscsc`) antes de qualquer DDL
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está em `.env.local` e **não** em `NEXT_PUBLIC_*`
- [ ] Confirmar que `@supabase/ssr` está instalado (`lib/supabase-clients.ts` depende dele)

---

## Fase 1 — Validar SQL localmente (1–2 h) ⛔ BLOQUEADOR

**Não executar nada no Supabase antes desta fase passar.** O SQL desta sessão só passou por `pglast.parse_sql()` — parse, não execução. Erros de recursão de policy só aparecem em runtime.

### 1.1 Stub de simulação Supabase

```bash
sudo -u postgres createdb otj_educacao_test
psql -d otj_educacao_test <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
DO $$ BEGIN
  CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
SQL
```

### 1.2 Executar base + patch, nesta ordem

```bash
psql -d otj_educacao_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.1.sql
psql -d otj_educacao_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.2-PATCH.sql
psql -d otj_educacao_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.0.sql
psql -d otj_educacao_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.1-PATCH.sql
```

Pontos de falha antecipados no patch (escrito sem execução):

- os blocos `DO $$ ... format('%1$I') ... $$` — a sintaxe posicional em `format()` é válida, mas nunca corri estes blocos
- `pode_gerir_escola()` chama `is_owner_educacao()` e `is_moderador_educacao()`, ambas `SECURITY DEFINER`. Encadeamento de SECURITY DEFINER funciona, mas confirmar que `search_path` se mantém fixo
- `ALTER TABLE ... DROP CONSTRAINT IF EXISTS matriculas_universitarias_numero_estudante_key` — o nome auto-gerado pode divergir. Confirmar com `\d matriculas_universitarias`

### 1.3 Verificações estruturais

```sql
-- Nenhuma tabela do módulo sem RLS. Deve devolver 0 linhas.
SELECT tablename FROM pg_tables t
WHERE schemaname='public'
  AND (tablename LIKE '%educacao%' OR tablename LIKE '%universitari%'
       OR tablename IN ('escolas','faculdades','inscricoes_uc','unidades_curriculares'))
  AND NOT EXISTS (SELECT 1 FROM pg_class c
                  WHERE c.relname=t.tablename AND c.relrowsecurity);

-- Nenhuma tabela com RLS e 0 policies. Deve devolver 0 linhas.
SELECT c.relname FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid=c.oid
WHERE c.relrowsecurity AND c.relnamespace='public'::regnamespace
GROUP BY 1 HAVING count(p.polname)=0;

-- Triggers updated_at: deve devolver 26.
SELECT count(*) FROM pg_trigger WHERE tgname='set_updated_at' AND NOT tgisinternal;
```

### 1.4 Testes comportamentais de RLS ⛔ o mais importante

Nenhuma das policies novas foi testada. Criar dados de teste e correr cada cenário com `SET ROLE authenticated` + `SET request.jwt.claim.sub`.

| # | Papel | Deve conseguir | Deve ser barrado |
|---|---|---|---|
| 1 | anon | ler escola publicada | ler `estudantes_perfil`, `estudantes_universitarios` |
| 2 | pessoa | editar o próprio perfil | editar perfil alheio |
| 3 | **moderador** | **ver e aprovar pedidos pendentes** | tocar noutra entidade |
| 4 | owner | tudo na sua entidade | outra entidade |
| 5 | pai | ver matrícula do filho | ver matrícula de outra criança |
| 6 | encarregado | ver matrícula do educando | idem |
| 7 | aluno | ver a própria matrícula | ver `observacoes_especiais` de colegas |
| 8 | estudante uni | inscrever-se em UC | **lançar a própria classificação** |
| 9 | docente | lançar nota na sua UC | lançar nota noutra UC |

O cenário 3 é a razão de ser do patch: na v2.1 era impossível. Se falhar, o patch não resolveu B1.
O cenário 8 é o que separa uma pauta de um formulário de auto-avaliação.

- [ ] Guardar os testes em `supabase/tests/rls_educacao.sql` e `rls_universidades.sql`
- [ ] Só depois de 9/9 passarem: executar no Supabase de produção

---

## Fase 2 — Decisões de arquitetura (⚠️ antes de escrever mais código)

Duas decisões que ficam mais caras a cada dia. Registar como ADR.

### D1 · Pessoas partilhadas entre módulos ⛔

Existem hoje `pessoas_educacao` e `pessoas_universitarias` — duas tabelas, dois espaços de username. O mesmo indivíduo fica com duas identidades sem ligação e `@joao.silva` pode ser duas pessoas. O Escutismo tem o seu próprio equivalente; cada módulo novo replica o padrão.

Opções:
- **A** — manter separado. Zero trabalho agora, divergência permanente.
- **B** — `pessoas` central com username global; `pessoas_*` passam a perfis por domínio com FK. Refactor de ~1 dia **agora**; muito mais caro com dados reais.

Escrever `ADR-0XX-PESSOAS-PARTILHADAS.md`. Recomendação: B, e antes da Fase 3.

### D2 · Faculdade: entidade ou especialização?

`entidades_universitarias.entidade_tipo` aceita `'faculdade'` **e** existe tabela `faculdades`. Foi esta ambiguidade que produziu o bug de FK em `criarMatriculaUniversitaria`. Escolher um dos dois e remover o outro.

### D3 · RGPD — dados de menores ⛔ **bloqueia dados reais**

O módulo Educação recolhe sobre crianças identificadas: nome, data de nascimento, género, morada, turma e **dados de saúde** (`observacoes_especiais`: alergias, necessidades educativas especiais). Categoria especial, art. 9.º, titulares vulneráveis.

Por fazer, tudo:
- [ ] base legal declarada, por finalidade
- [ ] AIPD (art. 35.º) — provavelmente obrigatória
- [ ] prazos de conservação + mecanismo de eliminação
- [ ] contrato de subcontratação com a Supabase; confirmar região de alojamento
- [ ] registo de acessos aos campos de saúde
- [ ] fluxo de consentimento parental e de revogação

O módulo Escutismo já tem política de proteção de menores (confirmação por tutor via token, acesso parental a mensagens de menores, desfoque automático de imagens). Educação recolhe mais e não herdou nada. **Reutilizar esse desenho em vez de reinventar.**

> Até isto fechar: **nenhum dado real de criança na base.** Só dados sintéticos.

### D4 · Typo `tipo_inscrpcao`

Está na coluna SQL e no tipo TS de ambos os módulos — consistente, mas errado. Renomear agora é trivial:

```sql
ALTER TABLE public.inscricoes_educacao RENAME COLUMN tipo_inscrpcao TO tipo_inscricao;
ALTER TABLE public.inscricoes_universitarias RENAME COLUMN tipo_inscrpcao TO tipo_inscricao;
```
Mais `sed` nos tipos e actions. Fazer **antes** de haver dados.

---

## Fase 3 — TypeScript (2–3 h)

Nada foi compilado. Não existe `tsconfig` nem `node_modules` do projeto no ambiente onde o código foi escrito.

```bash
cp lib_supabase_clients.ts            lib/supabase-clients.ts
cp lib_educacao_types_V2.1.ts         lib/educacao/types.ts
cp lib_educacao_actions_V2.2.ts       lib/educacao/actions.ts
cp lib_universidades_types_V3.0.ts    lib/universidades/types.ts
cp lib_universidades_actions_V3.1.ts  lib/universidades/actions.ts

npx tsc --noEmit
```

Erros esperados:

- [ ] `@supabase/ssr` em falta → `npm i @supabase/ssr`
- [ ] `lib/educacao/types.ts` não exporta os tipos usados por `criarEducando()` — alinhar
- [ ] `criarMatriculaUniversitaria` mudou de assinatura (`{ matricula }` → `{ matricula, inscricao }`) — actualizar chamadores
- [ ] `obterAnoLetivo()` foi acrescentada no fim do ficheiro; confirmar que não colide
- [ ] `createServiceClient` importado mas talvez não usado em Universidades → aviso de lint

### 3.1 Rever a substituição automática do cliente

A troca de service role por `createSessionClient()` foi feita por script sobre ~35 funções, não à mão. **Rever função a função:**

- [ ] cada action começa com `requireUser()` ou justifica não o fazer
- [ ] nenhuma `const supabase` duplicada no mesmo escopo
- [ ] `criarEducando()` é a única a usar `createServiceClient()` — confirmar que a autorização de quem chama está de facto garantida pela RLS de `matriculas_educacao` no passo seguinte, e não apenas assumida
- [ ] `.order()` com relação: usar `{ foreignTable: 'pessoas_educacao' }` ou ordenar em JS

---

## Fase 4 — Componentes React (2–3 h)

Nenhum foi renderizado.

```bash
cp form-registar-pai.tsx                    components/educacao/
cp form-registar-filho-CORRIGIDO.tsx        components/educacao/form-registar-filho.tsx
cp form-registar-estudante-uni-CORRIGIDO.tsx components/universidades/form-registar-estudante.tsx
cp form-registar-docente-uni.tsx            components/universidades/form-registar-docente.tsx
```

- [ ] `form-registar-filho`: confirmar que `Alert`/`AlertDescription` estão importados (acrescentei um bloco que os usa)
- [ ] `form-registar-pai`: remover `useAuth`/`user` e `resultado` — não usados
- [ ] `form-registar-docente-uni`: `especialidades` é `split(',')` de texto livre → passar a input de tags
- [ ] `Card` dentro de `Link` provoca erro de hidratação — verificar aninhamento (armadilha já conhecida no projeto)
- [ ] `numero_aluno` no form é livre; o índice único novo é `(turma_id, ano_letivo, numero_aluno)` → tratar o 23505 com mensagem legível

---

## Fase 5 — Páginas (4 h)

Nunca foram escritas — os documentos da sessão descreviam-nas como se existissem.

**Educação**
- [ ] `app/(educacao)/escolas/[id]/registar-como-pai/page.tsx`
- [ ] `app/(educacao)/escolas/[id]/registar-filho/page.tsx`
- [ ] `app/(educacao)/escolas/[id]/turmas/page.tsx`
- [ ] `app/(educacao)/escolas/[id]/inscricoes-pendentes/page.tsx` ← só testável depois da Fase 1.4 cenário 3
- [ ] `app/meu-perfil/pai/filhos/page.tsx`

**Universidades**
- [ ] `app/(universidades)/faculdades/[id]/registar-estudante/page.tsx`
- [ ] `app/(universidades)/faculdades/[id]/registar-docente/page.tsx`
- [ ] `app/(universidades)/faculdades/[id]/cursos/page.tsx`
- [ ] `app/meu-perfil/estudante/page.tsx`
- [ ] `app/meu-perfil/docente/ucs/page.tsx`

Notas: `[id]/page.tsx` com componentes cliente precisa de `'use client'` + `useParams()`, não de `params` server-side. Não correr `npm run dev` e `npm run build` em simultâneo (corrompe `.next`).

---

## Fase 6 — Email e teste ponta a ponta (2 h)

- [ ] SendGrid: template de confirmação de matrícula (`@sendgrid/mail@8.1.6` já instalado)
- [ ] Remetente: `noreply@superloja.com` está adiado para o Sprint 10 → usar o remetente básico do MVP
- [ ] **Email de menor:** com `email` agora nullable, a confirmação vai ao responsável parental, nunca à criança

**Fluxo Educação:** escola → turma → pai regista-se → regista filho → matrícula + inscrição pendente → email → moderador aprova → pai vê filho
**Fluxo Universidades:** faculdade → curso → ano letivo → UC → estudante matricula-se → inscreve-se em UC → docente lança nota → estudante vê classificação

- [ ] Confirmar que o estudante **não** consegue alterar a própria nota (cenário 8 da Fase 1.4)

---

## Fase 7 — Arrumação

- [ ] Consolidar os 9 documentos da sessão em dois: `MODULO-EDUCACAO.md` e `MODULO-UNIVERSIDADES.md`
- [ ] Mover os restantes para `_obsoleto/`
- [ ] Corrigir as contagens de linhas nos documentos que ficam (o número real de código é ~2.900 linhas, não 24.000)
- [ ] Remover as etiquetas "PRONTO PARA PRODUÇÃO" de material não executado
- [ ] `OTJ-CHANGELOG.md` e `OTJ-WORK-LOG.md`

---

## Estimativa

| Fase | Tempo | Bloqueia |
|---|---|---|
| 0 · Preparação | 15 min | tudo |
| 1 · Validação SQL | 1–2 h | ⛔ tudo |
| 2 · Decisões (D1, D3) | 2–4 h | ⛔ Fase 3+ |
| 3 · TypeScript | 2–3 h | Fase 4 |
| 4 · Componentes | 2–3 h | Fase 5 |
| 5 · Páginas | 4 h | Fase 6 |
| 6 · Email + E2E | 2 h | — |
| 7 · Arrumação | 1 h | — |
| **Total** | **14–19 h** | |

A estimativa de 11 h por módulo (22 h no total) que consta dos documentos da sessão pressupunha que SQL, tipos, actions e formulários estavam prontos. Estavam escritos, não prontos.

---

## Regra a manter

O material desta sessão passou no parser e falhou em tudo o resto. O parser diz que o SQL é gramatical, não que funciona. As notas do projeto já registavam ambas as armadilhas que voltaram a aparecer — RLS com referências mútuas, e documentação a acumular enquanto o build não avança.

**Nada é dado como pronto sem ter corrido.**
