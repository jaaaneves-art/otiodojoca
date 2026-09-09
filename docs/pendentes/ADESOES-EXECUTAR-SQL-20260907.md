# Pendente — Executar a camada genérica de adesões

**Data**: 07/09/2026 às 11:30
**Prioridade: alta — bloqueia todo o Módulo Educação e a continuação do Escutismo.**

Ficheiro a executar: `OTJ-SQL-ADESOES-V001.sql`
Desenho e justificação: `docs/sessions/MODULO-EDUCACAO-ADESOES-20260907.md`

---

## Verificações obrigatórias ANTES de executar

O ficheiro tem cinco pressupostos que não foram confirmados contra a base de
dados real. Cada um partiria o script, ou pior, passaria em silêncio.

### 1. `profiles.id` é igual a `auth.users.id`?

Todo o SQL compara `profile_id = auth.uid()`. Se existir uma coluna
`profiles.user_id` separada, **todas** as policies e helpers ficam errados —
e a falha é silenciosa: `auth.uid()` nunca coincide, tudo devolve vazio.

```sql
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position;

SELECT count(*) AS orfaos FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL;  -- tem de dar 0
```

### 2. Existe `profiles.data_nascimento`?

`e_menor()` verifica a coluna em runtime e, se não existir, **devolve sempre
`true`** — ou seja, toda a gente passa a menor e toda a adesão exige tutor.
Funciona, mas é inútil na prática.

```sql
SELECT 1 FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles' AND column_name='data_nascimento';
```

Se não existir: decidir se se acrescenta a `profiles` ou se a idade vive noutro
sítio. Não executar o SQL de adesões antes de resolver isto.

### 3. `pgcrypto` está instalado?

`gen_random_bytes` e `digest` são precisos para os tokens de convite.

```sql
SELECT extname FROM pg_extension WHERE extname='pgcrypto';
-- se vazio:  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
```

### 4. Já existe uma tabela de tutores?

O Escutismo tem tutoria/encarregado de educação no schema v5. Se já houver
tabela, **não criar `tutorias`** — migrar a existente, senão ficam duas fontes
de verdade sobre quem é tutor de quem.

```sql
\dt public.*tutor*
\dt public.*encarregado*
```

### 5. Sobreposição com `entidade_pedidos`

`entidade_pedidos` já existe e trata de pedidos de registo institucional
(ver `docs/decisoes/DECISAO-PARTICIPAR-REGISTO-PUBLICO-20260828.md` e
`DECISAO-JANELA-ENTRADA-PARCEIROS.md`). Resolve um problema parecido mas não
igual: registo *da entidade*, não adesão *de pessoas à entidade*.

Decidir explicitamente: coexistem, ou `entidade_pedidos` passa a ser um caso
particular de `adesoes`? Auditar antes, não durante.

---

## Como executar

**Nunca pelo SQL Editor.** Com DDL que cria tabelas, o editor mostra um diálogo
de confirmação e fica à espera em silêncio — o script parece ter corrido e não
correu.

```bash
psql "$SUPA_URL" -v ON_ERROR_STOP=1 -f OTJ-SQL-ADESOES-V001.sql
```

Porta 5432 direta, não o pooler em 6543.

O ficheiro está em `BEGIN`/`COMMIT` — se alguma coisa falhar a meio, não fica
nada meio-criado.

---

## Decisões ainda em aberto

### Idade: 16 ou 18?

Ficou **18 provisório**, em `config_plataforma.idade_adulto_adesoes`. Muda-se
com um UPDATE, sem DDL nem deploy.

Isto atravessa Educação, Escutismo e Universidades e nunca foi decidido. Um
aluno do secundário com 17 anos precisa de aprovação do encarregado para se
inscrever numa associação de estudantes? Provavelmente não — mas para uma
atividade de escuteiros, provavelmente sim. Se a resposta variar por tipo de
grupo, a idade tem de passar de global para uma coluna em `grupos`.

### Migrar `entidades_educacao.owner_id`

O modelo antigo tinha um proprietário único. O novo tem N moderadores. Quando o
Módulo Educação for reescrito, cada `owner_id` existente vira uma linha em
`grupos_moderadores` com `nivel='admin'`.

Há um trigger que impede remover o último admin de um grupo — a migração tem
de garantir que **todo o grupo fica com pelo menos um**, senão fica sem
ninguém que possa aprovar adesões.

---

## Depois de executar

Correr as verificações do fim do ficheiro SQL (RLS ativo nas 6 tabelas,
policies criadas) e testar o caminho completo com dois utilizadores reais:

1. A cria grupo → A fica admin
2. B faz `adesao_pedir` → fica pendente
3. A faz `adesao_aprovar_moderador` → passa a aprovada
4. C (menor) faz pedido → fica pendente **mesmo depois** da aprovação do moderador
5. Tutor de C faz `adesao_aprovar_tutor` → só agora passa a aprovada

O passo 4 é o que interessa testar a sério. Se um menor ficar aprovado só com o
moderador, a dupla aprovação não está a funcionar.
