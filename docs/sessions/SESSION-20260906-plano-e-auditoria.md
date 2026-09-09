# Plano do dia — domingo, 6 de setembro de 2026

**Preparado em:** 2026-09-05
**Âmbito:** todos os pendentes abertos desde segunda-feira, 31/08
**Máquina:** Linux Mint · `~/Nextcloud/Projectos/otiodojoca/` · Supabase `opdvusuwrhmbgkthscsc`

---

## 0. Atualização de 06/09 — auditoria do pacote de Segurança

O pacote de Segurança foi finalmente auditado (parser + execução em
PostgreSQL 16 contra uma réplica das tabelas do projeto). **Não corre.**
Os achados A1 e A2 confirmam-se em parte, mas o alvo do risco estava
errado e há um achado novo.

### A1 confirmado, e é mais extenso do que estava registado
`user_profiles` aparece **27 vezes no SQL e 6 no TypeScript**
(`04_lib_auth_register.ts`, `05_lib_auth_login.ts`, `06_lib_audit_log.ts`).
Corrigir os scripts SQL não chega: os quatro ficheiros TS também
apontam para a tabela errada.

### A8 ⛔ NOVO · `CREATE POLICY IF NOT EXISTS` não existe em PostgreSQL
Os dois scripts usam esta sintaxe **10 vezes**. O PostgreSQL rejeita-a:
`syntax error at or near "NOT"`. Não há forma de os scripts terem sido
executados alguma vez — o que contradiz a afirmação
"tudo foi testado (sem erros esperados)" em `PENDENTES_SEGURANCA_OTJ_SPRINT10.md`.

Correção: retirar `IF NOT EXISTS` e antepor `DROP POLICY IF EXISTS`.

### A2 estava a apontar para a tabela errada
Executei os dois scripts como o psql os correria sem `ON_ERROR_STOP`
(que é o comportamento do SQL Editor do Supabase: continua após erro).
Resultado medido:

| Tabela | RLS | Policies | Consequência |
|---|---|---|---|
| `freguesias` | **ativada** | **0** | ⛔ Módulo Freguesia a zero para todos |
| `audit_logs` | ativada | 0 | ⛔ A auditoria deixa de escrever |
| `email_audit_logs` | ativada | 0 | ⛔ Idem |
| `marketplace_ads` | não tocada | 0 | ✅ intacta |
| `profiles` | não tocada | 0 | ✅ intacta |

O Mercado da Terra **não** é a vítima: o bloco `DO $$` que lhe toca
falha antes de chegar ao `ALTER TABLE`, porque depende de
`user_profiles`. Quem cai é o **Módulo Freguesia** — o `ALTER TABLE
public.freguesias ENABLE ROW LEVEL SECURITY` está num bloco `DO $$`
isolado, sem policy nenhuma a seguir, e executa com sucesso. As 32
entidades publicadas na Fase D passam a devolver zero linhas.

A ironia das tabelas de auditoria: são criadas com RLS ativa e as
policies falham na sintaxe, portanto o sistema de auditoria fica
instalado e silenciosamente inoperante.

**Rollback a ter escrito antes de correr seja o que for:**
```sql
ALTER TABLE public.freguesias        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_audit_logs  DISABLE ROW LEVEL SECURITY;
```

### A9 · `profiles_select_policy USING (TRUE)`
Testei a hipótese de recursão nesta policy: **não há**. Mas `USING (TRUE)`
torna todas as colunas de todos os perfis legíveis por qualquer um,
incluindo `anon` — e o script acrescenta `role`, `status` e `last_login`.
Passa a ser possível enumerar quem são os admins. Restringir as colunas
ou a policy.

### A10 ⛔ NOVO · Dois schemas de Escutismo em conflito
Apareceu hoje às 08:35, de outra sessão, um `escutismo-schema-v1.sql`
com desenho diferente. **Corre limpo** (9 tabelas, 16 policies, 11
funções) e não tem nenhum dos erros das v2–v4. Não é descartável.

| | v1 (hoje) | v5 (04/09) |
|---|---|---|
| Associações múltiplas (CNE, AEP, ER, AGP) | ✅ `escutismo_associacoes` | ❌ campo de texto |
| Aprovadores | ✅ modelo genérico N-aprovadores | 2 responsáveis fixos |
| Recibos de leitura | ✅ `escutismo_leituras` | ❌ |
| Papéis em tabela | ✅ `escutismo_papeis` | ❌ derivados |
| Menores | ✅ via `encarregado_*` + CHECK | ✅ via `tutor_*` + trigger |
| **Fotografias / desfoque** | ❌ **ausente** | ✅ 2 tabelas + pipeline |
| Convite do tutor por token | ❌ | ✅ |
| Notificações | ❌ | ✅ |

Nenhum substitui o outro. O v1 tem melhor estrutura organizacional; o
v5 tem a proteção de imagem de menores, que foi requisito explícito.

**Isto bloqueia o Bloco E.** Aplicar um dos dois hoje sem decidir cria
uma migração que depois é preciso desfazer. Decisão a tomar antes de
qualquer DDL de Escutismo — ver DEC-4.

### DEC-4 · Qual schema de Escutismo (fecha antes do Bloco E)
Três caminhos:
1. **v1 + portar as fotos do v5** — recomendado. A base organizacional
   do v1 é melhor e as tabelas de fotos do v5 são acopláveis.
2. **v5 tal como está** — perde-se o suporte a múltiplas associações.
3. **Adiar o Escutismo** e usar o tempo do Bloco E no Bloco D.

### Efeito no orçamento do dia
O Bloco D cresce (corrigir SQL **e** os 4 ficheiros TS) e o Bloco E
fica bloqueado até DEC-4. Sugestão: trocar a ordem — fechar DEC-4 no
Bloco B, e se a opção for a 1, o Bloco E passa a ser trabalho de fusão,
não de aplicação, e não cabe hoje.


---

## 0b. Execução de 06/09 — Blocos A, C e D

Feito neste ambiente. Falta correr no seu.

### Prontos a executar · `03-seguranca/`

| Ficheiro | Bloco | Risco |
|---|---|---|
| `BLOCO-A-verificar.sql` | A | nenhum — só leitura |
| `BLOCO-C-stub-auth.sql` | C | nenhum — guardar em `supabase/tests/` |
| `01-SEGURANCA-auditoria.sql` | D | baixo — só tabelas novas |
| `02-SEGURANCA-perfis.sql` | D | **alto** — tabela viva |
| `99-ROLLBACK.sql` | D | ter aberto noutro separador |
| `00-tabelas.ts` + `03`–`06` | D | TypeScript corrigido |

Os originais estão em `_original-nao-corre/`.

### Mais três achados, encontrados ao corrigir

**A11 ⛔ · `profiles.email` não existe.** O `05_lib_auth_login.ts`
fazia `.select('email')` na tabela de perfis para resolver o login por
username. Contraria a decisão travada do projeto — o email vive apenas
em `auth.users`. O login por username nunca teria funcionado.
Corrigido: procura o `id` pelo username e vai buscar o email a
`supabase.auth.admin.getUserById()`. O `04_lib_auth_register.ts`
também gravava `email` no perfil; removido.

**A12 · Policies de INSERT com `WITH CHECK (TRUE)`.** As duas tabelas de
auditoria aceitavam escrita de qualquer utilizador autenticado — logs
forjados. O comentário dizia "inserido por server actions (SECURITY
DEFINER)", mas não havia `SECURITY DEFINER` nenhum. Corrigido: sem
policy de escrita e sem `GRANT INSERT`. O service role ignora RLS, que
é como a escrita deve entrar. Testado: `permission denied`.

**A13 · Faltava `'use server'` nos quatro ficheiros.** Todos leem
`SUPABASE_SERVICE_ROLE_KEY` e viviam em `lib/` sem guarda. A chave não
chegaria a vazar — o Next.js só injeta variáveis `NEXT_PUBLIC_*` no
browser — mas ficaria `undefined` no cliente, e o remendo instintivo
para isso é acrescentar o prefixo `NEXT_PUBLIC_`, que aí sim expõe a
chave. Acrescentado `'use server'` e `import 'server-only'`.

### Correções ao próprio pacote corrigido

Ao testar, o meu script 01 referenciava a coluna `role`, criada só pelo
02 — dependência de ordem. Removida: as policies de auditoria usam
apenas `user_id = auth.uid()`. A leitura de todos os logs pela consola
de administração faz-se por service role.

### Verificação

Os dois scripts correm limpos nos **dois** cenários de nome de tabela
(`profiles` e `user_profiles`) — não é preciso esperar pelo Bloco A
para os ter prontos, mas o resultado do Bloco A confirma qual foi
apanhado. `freguesias` fica **intocada** em ambos.

| Teste | Resultado |
|---|---|
| Visitante anónimo lê freguesias (regressão) | ✅ continua a ler |
| Visitante anónimo lê perfis públicos | ✅ continua a ler |
| Utilizador vê só os seus logs | ✅ 1 de 2 |
| Utilizador forja um log | ✅ permission denied |
| Utilizador apaga logs | ✅ permission denied |
| Utilizador altera perfil alheio | ✅ 0 linhas |
| Username `Yos` vs `yos` | ✅ rejeitado (índice único em lower) |
| `role = 'superadmin'` | ✅ rejeitado pelo CHECK |

### Fora do âmbito, de propósito

O bloco do `marketplace_ads` foi **retirado** do script 02. São 35
pontos de chamada e precisa do Mercado da Terra testado logo a seguir
— fica para um `03-SEGURANCA-marketplace.sql` próprio, noutro dia.

Duas coisas ficam por resolver e estão anotadas no fim do script 02:
a policy de leitura expõe `role` e `status` a qualquer visitante, e
`profiles_update_own` não impede alguém de alterar o próprio `role`.
A correção passa por uma view pública e por um trigger que congele os
campos sensíveis — precisa de saber que colunas a tabela tem.

### Bloco E continua bloqueado

DEC-4 por decidir: v1 ou v5 do Escutismo. Nada de DDL até lá.

---

## 0c. Execução em produção — 06/09 manhã

O Bloco A foi corrido e mudou o quadro por completo. Metade do Sprint 10
já estava feito na base; e apareceu um problema real que não constava
de plano nenhum.

### ✅ CORRIGIDO EM PRODUÇÃO · Emails expostos a visitantes anónimos

`profiles` tem uma coluna `email` preenchida (44 de 44, consistentes com
`auth.users`) e a policy `"Perfis publicos visiveis para todos"` é
`USING (true)`. Como a RLS filtra linhas e não colunas, qualquer pessoa
com a chave publicável — que está no JavaScript do site — lia os 44
endereços sem ter conta.

Confirmado com pedido real à API REST antes e depois. Corrigido com
REVOKE ao nível da tabela e GRANT por coluna, excluindo `email`.
Verificado: pedido com `email` devolve 42501; pedido com `username`
devolve 200; o site continua a funcionar.

Nenhum ficheiro do projeto faz `select('*')` em `profiles`, por isso a
correção não parte nada.

### ✅ CORRIGIDO EM PRODUÇÃO · Quatro tabelas sem RLS

`culturas_aptidoes` e `culturas_produtos` (catálogo real) passaram a ter
RLS com leitura pública. `culturas_guia_backup_20260820` e
`culturas_guia_backup_fase7_20260820` ficaram com RLS e zero policies —
fechadas a tudo menos service role.

### O Sprint 10 já estava quase todo feito

| Queria acrescentar | Estado real |
|---|---|
| `username` | já existia, NOT NULL |
| `role` | já existia, enum `user_role` (user/moderator/admin) |
| RLS em `profiles` | já ativa, 3 policies |
| `audit_logs` | **não criar** — existe `audit_log` no singular |
| `status`, `email_verified`, `last_login` | faltam |
| `email_audit_logs` | falta |

O CHECK do meu script era redundante: o enum já garante os valores.

### Achados meus que estavam errados

**A2 (freguesias).** Testei contra um stub onde `freguesias` não tinha
policies. Na base real já tem RLS com leitura pública, portanto o
`ENABLE` do script original seria inofensivo. Retirado.

**A11 (`profiles.email`).** Disse que a coluna não existia, por
extrapolar da regra do projeto em vez de verificar. Existe e está
consistente. O login por username funcionava. A correção que fiz ao
`05_lib_auth_login.ts` passa a ser necessária por outra razão: depois do
REVOKE, a sessão do utilizador já não lê essa coluna.

**Privilégios `anon`.** Alarmei-me com `anon` a ter INSERT/DELETE/TRUNCATE
em ~50 tabelas. É o comportamento por omissão do Supabase, que apoia a
segurança na RLS e não nos GRANTs. Falso alarme.

### Por fazer, por ordem

1. `"Sistema cria perfis automaticamente"` em `profiles` tem
   `WITH CHECK (true)` no INSERT — qualquer visitante cria perfis pela
   API. Ver se `handle_new_user()` depende dela antes de mexer.
2. Decidir se os dois backups de agosto saem de vez (`DROP TABLE`).
3. Limpar registos de teste em `profiles` (`TRIGGER_EXECUTADO`, etc).
4. Reescrever o script 02 reduzido ao que falta mesmo.
5. Adaptar `06_lib_audit_log.ts` às colunas reais da `audit_log`
   (`ip` e não `ip_address`, `success` booleano e não `status`,
   `details` e não `old_values`/`new_values`).

### Lição para os pacotes que faltam

Nada do que foi corrigido hoje constava de qualquer documento. Foi tudo
encontrado a olhar para a base. Os pacotes de Educação e Universidades
ainda só passaram no parser — a regra 1 do plano continua a valer.

---

## 0d. Fecho do dia — 06/09, 17h

### Aplicado em produção

| | |
|---|---|
| **Emails fechados** | os 44 endereços em `profiles.email` estavam legíveis por qualquer visitante com a chave publicável. REVOKE + GRANT por coluna. |
| **RLS nas 4 tabelas que faltavam** | `culturas_aptidoes`, `culturas_produtos`, dois backups de agosto. Já não há tabelas sem RLS. |
| **Sprint 10** | `profiles.status`, `profiles.last_login`, `audit_log.resource_type/id`, `email_audit_logs`, função `email_verificado()`. A policy de INSERT com `WITH CHECK (true)` na `audit_log` foi removida. |
| **Escutismo** | schema v1 + patch de fotos. 11 tabelas, 19 policies, view `escutismo_membros_v`, 2 guardas de menores. |

### Corrigido no código (commit pendente)

Quatro rotas dinâmicas com `params` síncrono (Next 16), o link para
editar anúncios no Mercado da Terra, e um bug de `details` NOT NULL na
gravação da edição.

### O que custou tempo, e porquê

**O SQL Editor do Supabase pede confirmação quando um script cria
tabelas** ("Run with/without RLS"). Enquanto não se responde, o script
não corre — e a verificação a seguir devolve zero, sem erro nenhum.
Perdemos mais de uma hora a diagnosticar um script que nunca chegou a
ser executado. Para scripts com DDL, usar o psql:

```bash
read -rsp "Connection string: " SUPA_URL; echo
echo "$SUPA_URL" | sed 's/:[^:@]*@/:***@/'   # confirmar antes de correr
psql "$SUPA_URL" -v ON_ERROR_STOP=1 -f ficheiro.sql
unset SUPA_URL
```

O `ON_ERROR_STOP=1` mostra o erro na linha exata. O editor não mostra.

**Bracketed paste corrompeu comandos várias vezes** — `^[[200~`, `\ \`,
duas linhas coladas juntas. Um `wget -O-` com a linha corrompida chegou
a escrever para ficheiro em vez de stdout e deu-nos uma confirmação
falsa. Escrever à mão os comandos curtos.

**Correr o mesmo `sed` duas vezes** duplicou uma linha e partiu o build.
Confirmar com `grep -c` antes de compilar.

### Incidente de segurança

A password da base de dados foi escrita em claro no terminal e colada
no chat. Foi reposta. O histórico do bash deve ser limpo:
`sed -i '/supabase.co/d' ~/.bash_history`.

### Por fazer

- Commit dos 5 ficheiros (`app/`), sem misturar com o catálogo de
  viaturas que está a ser feito noutra sessão
- Agendar `escutismo_atualiza_menoridade()` no pg_cron, diariamente
- Criar os dois buckets de Storage do Escutismo (privado e público)
- Botão de editar nos outros 4 módulos (`gran-bazar`, `imoveis`, `lup`,
  `viaturas`) — ver `docs_pendentes_EDITAR-ANUNCIOS-SEM-LINK`
- Copiar os 4 TypeScript do Sprint 10 para `lib/` e fazer build
- Testar registo de utilizador novo; se correr, remover a policy de
  INSERT anónimo em `profiles`
- **Educação e Universidades** continuam por aplicar. Só passaram no
  parser. O `otj_test` local já está montado — usar.

## 1. O que está em cima da mesa

Três pacotes de trabalho foram produzidos esta semana. Nenhum foi aplicado.

| # | Pacote | Sessão | Estado real | Horas estimadas |
|---|--------|--------|-------------|-----------------|
| 1 | **Segurança / Sprint 10** — audit logs, RLS, login por username | 05/09 manhã | escrito, **nunca auditado, nunca executado** | ~3,5 h |
| 2 | **Escutismo** — schema v5 | 03–04/09 | escrito e **executado com sucesso em PostgreSQL 16 local** | 31–39 h (total do módulo) |
| 3 | **Educação + Universidades** — schemas v2.2 / v3.1 + patches | 05/09 tarde | auditado, corrigido, **só passou no parser** | 14–19 h |

Soma: 50–60 h de trabalho por fazer. **Amanhã é um dia.** O plano abaixo escolhe o que cabe e diz porquê o resto fica de fora.

Pendentes anteriores a 31/08 continuam abertos e não entram neste plano: OAuth social login, Netuno/códigos postais, StandGo/Autonex, Empregos/JobNex, `db diff` declarativo.

---

## 2. Auditoria — o que está errado nos pendentes

Sete achados no dia 05. A auditoria de 06 acrescenta três (A8, A9, A10) e corrige o alvo do A2 — ver secção 0.

### A1 ⛔ · A tabela `user_profiles` não existe

O pacote de Segurança (`02_SQL_RLS_POLICIES.sql`) opera sobre `public.user_profiles`: ativa RLS, acrescenta `username`, `role`, `status`, `email_verified`, `last_login`.

No código do projeto a tabela chama-se **`profiles`** (5 chamadas em `perfil-publico`, `messages-inbox`, `conversation-page`). `user_profiles` aparece uma única vez em todo o projeto — numa lista dentro de `OTJ-SQL-V01.md`, um documento.

Consequência: o script falha na primeira instrução, ou — pior — se estiver guardado com `IF EXISTS` não faz nada e fica a impressão de que a RLS ficou ativa. O login por username também não funcionaria, porque a coluna nunca chegaria a `profiles`.

**Ação:** confirmar o nome real antes de tudo o resto e corrigir o script. Ver Bloco A.

### A2 ⛔ · Ligar RLS em `marketplace_ads` pode derrubar o Mercado da Terra

`marketplace_ads` é real e está vivo: **35 chamadas** no código. O marketplace usa `createClient()` de `@/lib/supabase/server` — cliente de sessão, logo **a RLS aplica-se de imediato**.

Se as policies não cobrirem o caminho de leitura pública (visitante anónimo a listar anúncios), o Mercado da Terra fica vazio no momento em que o script correr. O mesmo vale para `profiles`: se a policy for "cada um vê a sua linha", os perfis públicos e as caixas de mensagens deixam de mostrar o nome do interlocutor.

A auditoria de ontem à tarde encontrou exatamente este padrão nos módulos novos — RLS ativa com policies incompletas. O pacote da manhã nunca foi submetido ao mesmo escrutínio.

**Ação:** não ativar RLS em tabelas vivas antes de validar localmente. Ter o rollback escrito e à mão:
```sql
ALTER TABLE public.marketplace_ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        DISABLE ROW LEVEL SECURITY;
```

### A3 ⛔ · Não correr `npx supabase db diff`

Já está registado em `docs_pendentes_DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md`: `schema_paths = []` no `config.toml` faz o `db diff` propor **DROP em todas as ~90 tabelas**. As 25 migrations desde 20/08 foram escritas à mão.

Os três pacotes de amanhã pedem migrations versionadas. **Escrever à mão**, com timestamp, como sempre.

### A4 · Cliente Supabase duplicado

A correção de ontem introduz `lib/supabase-clients.ts` com `createSessionClient()`. O projeto já tem `@/lib/supabase/server` com `createClient()`, usado nas 105 chamadas existentes.

Criar um segundo módulo de clientes em paralelo é como o projeto acaba com duas convenções para a mesma coisa.

**Ação:** adaptar as actions de Educação/Universidades ao cliente existente. Acrescentar a `@/lib/supabase/server` apenas o que falta de facto — `createServiceClient()`, `requireUser()`, `fetchAllRows()` — em vez de um ficheiro novo.

### A5 · `tg_set_updated_at()` é global e é criada com `CREATE OR REPLACE`

Os dois patches criam `public.tg_set_updated_at()` com `CREATE OR REPLACE`. Se já existir uma função com este nome e outro corpo, é silenciosamente substituída — e passa a afetar todos os triggers do projeto que a usem.

**Ação:** antes de aplicar, verificar:
```sql
SELECT proname, prosrc FROM pg_proc
WHERE proname IN ('tg_set_updated_at','set_updated_at','handle_updated_at');
```
Se já existir uma equivalente, usar essa e remover a criação dos patches.

### A6 · Três decisões repetidas em três módulos

As decisões pendentes sobrepõem-se e estavam a ser tratadas em separado:

| Assunto | Escutismo | Educação | Universidades |
|---|---|---|---|
| Idade de proteção de menores | D1 — 16 vs 18 (imagem) | D3 — nada definido | — |
| Identidade / username | tabela própria | `pessoas_educacao` | `pessoas_universitarias` |
| RGPD de menores | política desenhada | nada | parcial |

São **uma** decisão cada, não três. Ver secção 3.

Nota importante: o pacote de Segurança acrescenta `username` a `profiles` — ou seja, **já responde à questão da identidade partilhada**. Se `profiles.username` for o espaço de nomes global, os usernames por módulo passam a redundantes e o refactor deixa de ser uma discussão aberta.

### A7 · O SendGrid já está instalado

O plano da manhã inclui `npm install @sendgrid/mail@8.1.6` (10 min). Já está instalado. Substituir por verificação:
```bash
npm ls @sendgrid/mail
```
O que falta de facto é o **teste de entrega ponta a ponta**, que continua adiado e que bloqueia a Fase 4 do Escutismo (todo o fluxo de inscrição de menores depende de o email chegar ao tutor).

---

## 3. Decisões — 45 min, antes de qualquer código

Três decisões. Duas fecham-se amanhã; a terceira abre um processo externo.

### DEC-1 · Limiar de idade (fecha amanhã)

Em Portugal os limiares não coincidem:
- consentimento para tratamento de dados (RGPD / Lei 58/2019): **13 anos**
- direito à imagem (art. 79.º do Código Civil): acompanha a menoridade, **18 anos**

O schema do Escutismo usa 16 para tudo — um escuteiro de 17 anos publica fotografias sem autorização parental.

**Proposta:** duas constantes separadas — tutela e acompanhamento aos **16**, autorização de imagem aos **18**. É alteração de constante, não de arquitetura, e vale para Escutismo *e* Educação.

Aplicar antes da migração: ajustar `escutismo_eh_menor()` e acrescentar `escutismo_precisa_autorizacao_imagem()`.

> Confirmar com jurista quando houver oportunidade. A escolha de 18 é a conservadora; não bloqueia o trabalho.

### DEC-2 · Identidade partilhada (fecha amanhã)

**Proposta:** `profiles.username` passa a ser o espaço de nomes global e único. `pessoas_educacao`, `pessoas_universitarias` e os membros de Escutismo passam a perfis de domínio com FK para `profiles`, sem username próprio.

Custo agora: baixo, nada em produção nestes módulos. Custo daqui a dois módulos: alto.

Escrever `ADR-0XX-IDENTIDADE-PARTILHADA.md`. A implementação não é para amanhã — a decisão é.

### DEC-3 · RGPD de menores (abre processo, não fecha)

Três módulos passam a tratar dados de crianças identificadas. O Escutismo tem política desenhada (confirmação do tutor por token, acesso parental, desfoque de imagens). Educação recolhe **mais** — incluindo dados de saúde em `observacoes_especiais`, categoria especial do art. 9.º — e não herdou nada.

Uma política só, transversal aos três. Por fazer:
- base legal por finalidade
- AIPD (art. 35.º) — provavelmente obrigatória
- prazos de conservação e mecanismo de eliminação
- contrato de subcontratação com a Supabase; região de alojamento
- registo de acessos aos campos sensíveis

**Regra em vigor desde já:** nenhum dado real de criança na base. Só dados sintéticos.

---

## 4. Ordem de execução

A lógica: primeiro a rede de segurança, depois o ambiente que os três pacotes partilham, depois o material do mais verificado para o menos verificado. Nada vai a produção sem ter corrido em local.

### Bloco A — Rede de segurança · 30 min · sem DDL

- [ ] Confirmar que os ficheiros das três sessões estão em `~/Transferências/` (se não estiverem, o dia pára aqui)
- [ ] Backup do Supabase antes de qualquer DDL
- [ ] `git status` limpo; sair de `migration/extract-opf`; `git checkout -b feature/sprint10-seguranca`
- [ ] Confirmar os nomes reais das tabelas — **resolve A1**:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname='public'
  AND (tablename LIKE '%profile%' OR tablename LIKE 'marketplace%')
ORDER BY 1;
```
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está em `.env.local` e **não** em `NEXT_PUBLIC_*`
- [ ] `npm ls @sendgrid/mail @supabase/ssr` — verificar em vez de instalar (A7)
- [ ] Verificar se `tg_set_updated_at` já existe (A5)

### Bloco B — Decisões · 45 min

- [ ] DEC-1: fixar 16 / 18 e ajustar o schema do Escutismo **antes** de o aplicar
- [ ] DEC-2: escrever o ADR de identidade partilhada
- [ ] DEC-3: abrir `docs/RGPD-MENORES.md` a partir da política do Escutismo, marcar o que falta

### Bloco C — Ambiente de validação local · 60–90 min · serve os três pacotes

Feito uma vez, usado três vezes. É o investimento mais rentável do dia.

```bash
sudo apt install postgresql-16
pip install pglast --break-system-packages
sudo -u postgres createdb otj_test
```

```sql
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE anon;          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
```

- [ ] Guardar o stub em `supabase/tests/_stub_auth.sql` para não voltar a escrevê-lo

### Bloco D — Auditar e corrigir o pacote de Segurança · 45–60 min

O único pacote da semana que ninguém reviu.

- [ ] Corrigir `user_profiles` → nome real confirmado no Bloco A
- [ ] Ler as policies uma a uma e confirmar que cobrem os caminhos vivos:
  - visitante anónimo lista anúncios publicados
  - utilizador lê o perfil público de outro (`perfil-publico`)
  - caixa de mensagens mostra o nome do interlocutor (`messages-inbox`)
- [ ] Correr `01_` e `02_` em `otj_test` com `ON_ERROR_STOP=1`
- [ ] Teste com `SET ROLE anon`: o `SELECT` de anúncios publicados **tem** de devolver linhas
- [ ] Só então decidir se vai a produção hoje

**Se falhar, não insistir.** As tabelas de auditoria (`email_audit_logs`, `audit_logs`) são novas e sem risco — essas podem ir. A ativação de RLS em tabelas vivas espera pelo dia seguinte, com o marketplace testado a seguir.

### Bloco E — Escutismo Fase 1 · 60 min

O material mais sólido da semana: 804 linhas, 136 statements, executado e testado em PostgreSQL 16 com seis utilizadores.

- [ ] Aplicar DEC-1 ao schema antes de correr
- [ ] Correr `escutismo-schema-v5.sql` em `otj_test`
- [ ] Aplicar no Supabase
- [ ] Confirmar 9 tabelas, a view `escutismo_membros_v`, 6 funções, RLS ativa em todas
- [ ] Repetir dois testes no Supabase: menor sem tutor (deve falhar); utilizador sem relação a ler grupos (deve devolver zero)
- [ ] Migration **escrita à mão** em `supabase/migrations/` com timestamp (A3)
- [ ] `escutismo-tipos-v5.ts` → `lib/escutismo/tipos.ts`; `npm run build`

**Risco:** validado em PostgreSQL 16 puro. O Supabase acrescenta PostgREST e o seu próprio `auth`. Atenção às funções `SECURITY DEFINER` e ao `security_invoker` da view.

### Bloco F — Educação e Universidades Fase 1 · 90–120 min

Só passou no parser. É o pacote menos verificado e vai por último de propósito.

- [ ] Correr em `otj_test`, **nesta ordem**: base → patch, módulo a módulo
```bash
psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.1.sql
psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.2-PATCH.sql
psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.0.sql
psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.1-PATCH.sql
```
- [ ] Pontos de falha antecipados: blocos `DO $$ ... format('%1$I') ... $$`; encadeamento de `SECURITY DEFINER` em `pode_gerir_escola()`; nome auto-gerado da constraint `matriculas_universitarias_numero_estudante_key`
- [ ] Verificações estruturais: nenhuma tabela do módulo sem RLS; nenhuma tabela com RLS e zero policies; 26 triggers `updated_at`
- [ ] **Os 9 cenários de RLS.** O cenário 3 (moderador vê e aprova pedidos pendentes) é a razão de ser do patch — se falhar, o defeito bloqueante não foi resolvido. O cenário 8 (estudante **não** lança a própria nota) é o que separa uma pauta de um formulário de auto-avaliação.
- [ ] Guardar em `supabase/tests/rls_educacao.sql` e `rls_universidades.sql`
- [ ] **Não aplicar no Supabase hoje.** 9/9 primeiro.

### Bloco G — Fecho · 30 min

- [ ] Commit por bloco, mensagens descritivas
- [ ] `OTJ-CHANGELOG.md` e `OTJ-WORK-LOG.md`
- [ ] Atualizar este documento com o que ficou por fazer

---

## 5. Orçamento do dia

| Bloco | Tempo | Bloqueia |
|---|---|---|
| A · Rede de segurança | 30 min | ⛔ tudo |
| B · Decisões | 45 min | ⛔ E, e todo o código futuro |
| C · Ambiente local | 60–90 min | ⛔ D, E, F |
| D · Auditar Segurança | 45–60 min | produção |
| E · Escutismo Fase 1 | 60 min | Fases 2–7 |
| F · Educação/Uni Fase 1 | 90–120 min | Fases 3–7 |
| G · Fecho | 30 min | — |
| **Total** | **6 h 20 – 7 h 45** | |

---

## 6. O que fica de fora, e porquê

| Fica de fora | Razão |
|---|---|
| Escutismo Fases 2–7 (server actions, componentes, páginas, fotos) | 30–38 h. A Fase 4 está bloqueada pelo teste do SendGrid |
| Educação/Uni Fases 3–7 (TypeScript, componentes, páginas) | Dependem de 9/9 no Bloco F |
| Ativação de RLS em `profiles` e `marketplace_ads` em produção | Só se o Bloco D passar limpo e sobrar tempo. Caso contrário, dia seguinte |
| Implementação da DEC-2 (identidade partilhada) | A decisão é para amanhã; o refactor é trabalho à parte |
| Freguesia Fases E e F | Fora do âmbito da semana, mas continua aberto desde 19/08 |
| Pendentes de 28–30/08 (OAuth, Netuno, StandGo, Empregos) | Fora da janela |

---

## 7. Regras para o dia

1. **Nada vai a produção sem ter corrido em local.** O material desta semana passou no parser e falhou em tudo o resto. O parser diz que o SQL é gramatical, não que funciona.
2. **Nada de `supabase db diff`.** Migrations à mão.
3. **Uma tabela viva de cada vez**, com o `DISABLE ROW LEVEL SECURITY` já escrito antes de correr o `ENABLE`.
4. **Zero documentação nova.** O projeto tem 400+ ficheiros markdown e três módulos por executar. Este documento substitui, não acrescenta.
5. **Dados reais de menores: nenhum**, até a DEC-3 fechar.
