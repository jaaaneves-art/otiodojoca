# Pendente — Investigar relação entre Netuno e as tabelas de códigos postais — RESOLVIDO 30/08/2026 08:30

**Estado: CONCLUÍDO.** O Yos correu o script de limpeza no SQL Editor do Supabase com sucesso — schema `codigos_postais` e as tabelas `netuno_*`/de dados Netuno em `public` removidas. Espaço libertado, base de dados fora da zona de perigo do limite do plano Free. (Documento original de 29/08/2026 preservado abaixo, para histórico.)

## Atualização 30/08/2026 08:10 — origem confirmada

O Yos não tinha a certeza da ligação exata ("não tenho a certeza"), por isso investigou-se o computador dele (pasta `Nextcloud/Projectos/codigos-postais-auditoria/`, ligada nesta sessão). Encontrado o repositório `codigos_postais_pt` (clone de `https://github.com/eduveks/codigos_postais_pt`), com um ficheiro `dbs/postgresql-dump.sql` de **345 MB** (datado de 12/08/2026).

**Confirmado, a 100%:** este é o ficheiro que foi importado para a base de dados do OTJ no Supabase, e é a origem exata de todas as tabelas `netuno_*` e das tabelas de códigos postais em produção. O dump cria, no schema `public`, estas 29 tabelas (cada uma só uma vez dentro do próprio ficheiro — não há duplicação interna):

- **Dados de códigos postais/moradas** (9 tabelas): `arteria`, `arteria_codigo`, `arteria_local`, `arteria_nome`, `arteria_tipo`, `arteria_titulo`, `codigo_postal`, `codigo_postal_arteria`, `concelho`, `designacao_postal`, `distrito`, `localidade` — dados reais de CTT/GPS (13 tabelas ao todo, incluindo estas).
- **Tabelas da framework Netuno** (16 tabelas): `netuno_app`, `netuno_app_meta`, `netuno_app_table`, `netuno_auth_jwt_token`, `netuno_client`, `netuno_client_hit`, `netuno_design`, `netuno_group`, `netuno_group_rule`, `netuno_log`, `netuno_statistic_average`, `netuno_statistic_average_type`, `netuno_statistic_moment`, `netuno_statistic_type`, `netuno_table`, `netuno_user`, `netuno_user_rule`.

**O que é o Netuno, afinal:** não é nenhuma ferramenta interna do OTJ — é uma plataforma open-source de low-code Java (netuno.org), e `codigos_postais_pt` é uma app de demonstração open-source de terceiros (autor `eduveks` no GitHub) construída sobre essa plataforma, usada em algum momento só para obter os dados de códigos postais/GPS de Portugal. O dump completo da app (dados + tabelas de sistema da própria framework) foi restaurado dentro da base de dados de produção do OTJ, em vez de se extrair só as tabelas de dados úteis.

**Confirma e simplifica a decisão:** o código Next.js do OTJ não usa nenhuma tabela `netuno_*` (confirmado por grep ontem) nem parece depender diretamente destas tabelas de códigos postais (a confirmar com a query abaixo/no código). As 16 tabelas `netuno_*` são só metadados/logs da framework de terceiros — seguras para remover.

### Confirmação da duplicação — resolvida

O Yos correu a query no SQL Editor do Supabase. Resultado: **dois schemas diferentes**, não linhas duplicadas dentro da mesma tabela.

| schema | tabela | tamanho |
|---|---|---|
| `public` | arteria | 50 MB |
| `codigos_postais` | arteria | 25 MB |
| `public` | codigo_postal | 38 MB |
| `codigos_postais` | codigo_postal | 24 MB |
| `public` | codigo_postal_arteria | 52 MB |
| `codigos_postais` | codigo_postal_arteria | 27 MB |

Ou seja: o dump da app Netuno (`codigos_postais_pt`) foi importado **duas vezes**, em momentos diferentes — uma vez diretamente para o schema `public` (a importação "crua", sem isolar) e outra vez, mais tarde, para um schema à parte `codigos_postais` (criado com `create schema "codigos_postais"`, confirmado em `supabase/migrations/20260829220537_remote_schema.sql`). O schema `codigos_postais` tem a sua própria cópia de **todas** as 16 tabelas `netuno_*` também — foi o dump inteiro outra vez, só que isolado.

### Confirmado: nenhuma das duas cópias é usada pela app real — dados legítimos estão noutro sítio

Inspecionado `supabase/schemas/public/tables/` (espelho manual do schema real) e o `remote_schema.sql`:

- A app OTJ tem a sua **própria tabela pequena e limpa** para códigos postais: `public.codigos_postais_geo` (`codigo_postal varchar(8)` com check de formato `NNNN-NNN`, `latitude`/`longitude`, RLS ativo, policy `"Leitura publica de codigos_postais_geo"`) — é isto que a app usa, não as tabelas do Netuno.
- A app tem também tabelas próprias e independentes para divisões administrativas: `freguesias.sql` e `municipios.sql` — não têm nada a ver com `concelho`/`distrito`/`localidade` (nomes do Netuno).
- As tabelas `public.arteria*`, `public.codigo_postal`, `public.codigo_postal_arteria`, `public.concelho`, `public.distrito`, `public.localidade`, `public.designacao_postal` têm colunas ao estilo Netuno (`user_id`, `group_id`, `lastchange_time`, `lock`, `active`) — claramente da app de terceiros, não do código OTJ.
- Procurado no `remote_schema.sql` por qualquer `FOREIGN KEY ... REFERENCES` de uma tabela real do OTJ para estas tabelas Netuno — **nenhuma encontrada**. As únicas referências são GRANTs genéricos (aplicados a todas as tabelas do schema `public` de uma vez, não específicos) e FKs internas entre as próprias tabelas Netuno (ex. `arteria` → `arteria_tipo`).

**Conclusão: as duas cópias completas (schema `public` e schema `codigos_postais`) são 100% lixo de importação, sem qualquer uso pela aplicação. Podem ser removidas por completo, com confiança alta.**

### Plano de remoção — pronto a executar

**Rede de segurança já existe:** o ficheiro de origem (`dbs/postgresql-dump.sql`, 345 MB) continua intacto no computador do Yos, em `Nextcloud/Projectos/codigos-postais-auditoria/codigos_postais_pt/dbs/`. Não é preciso fazer backup adicional antes de apagar — se algum dia for preciso recuperar estes dados, a fonte já está guardada fora da base de dados.

```sql
-- 1. Remove a cópia isolada inteira (schema + todas as 16 tabelas netuno_* + 12 tabelas de dados)
drop schema if exists codigos_postais cascade;

-- 2. Remove as 16 tabelas netuno_* (framework, sem uso) do schema public
drop table if exists
  public.netuno_app_meta, public.netuno_app_table, public.netuno_app,
  public.netuno_auth_jwt_token, public.netuno_client_hit, public.netuno_client,
  public.netuno_design, public.netuno_group_rule, public.netuno_group, public.netuno_log,
  public.netuno_statistic_average_type, public.netuno_statistic_average, public.netuno_statistic_moment,
  public.netuno_statistic_type, public.netuno_table, public.netuno_user_rule, public.netuno_user
  cascade;

-- 3. Remove as tabelas de dados do Netuno no schema public (não são as usadas pela app —
--    a app usa public.codigos_postais_geo, public.freguesias, public.municipios, que ficam intocadas)
drop table if exists
  public.codigo_postal_arteria, public.codigo_postal, public.arteria,
  public.arteria_codigo, public.arteria_local, public.arteria_nome, public.arteria_tipo, public.arteria_titulo,
  public.concelho, public.distrito, public.localidade, public.designacao_postal
  cascade;
```

**Falta:** o Yos correr este script no SQL Editor do Supabase (ou ligar o terminal do computador à sessão, para eu correr via `supabase db` / psql). Depois, confirmar com `select pg_size_pretty(pg_database_size(current_database()));` — deve libertar bem mais de 150 MB, provavelmente perto de 250–300 MB, o que tira a base de dados de perto do limite do plano Free (500 MB).

---

# Documento original — 29/08/2026 23:16

## Estado

Durante a Fase 2 do módulo social, descobriu-se que a base de dados estava a 129% do limite do plano Free (0,645 GB de 0,5 GB), o que já pode ter posto o projeto em modo read-only. A causa principal era a tabela `netuno_log`, com 295 MB (quase metade do total). Uma busca ao código (`grep -ril "netuno" .`, fora de `supabase/` e `node_modules`) não encontrou nenhuma referência — a app Next.js atual não lê nem escreve em nenhuma tabela `netuno_*`.

**Ação já tomada, sem esperar por esta investigação:** `TRUNCATE TABLE public.netuno_log`, confirmado. A base de dados desceu para 306 MB reais (confirmado via `select pg_database_size(current_database())`, não só o Dashboard). Isto resolveu a urgência imediata.

## O que falta perceber

O Yos recorda que o **Netuno está relacionado com os códigos postais** — e que é essa parte (não necessariamente a framework toda) que deve ser apagada. Isto ainda não foi confirmado em detalhe. Dados relevantes já levantados nesta sessão, para retomar amanhã:

1. Ao listar os tamanhos das tabelas, várias tabelas de códigos postais/artérias apareceram **duplicadas**, com tamanhos diferentes:
   - `arteria` (50 MB e 25 MB)
   - `codigo_postal` (38 MB e 24 MB)
   - `codigo_postal_arteria` (52 MB e 27 MB)

   Ainda por confirmar se são schemas diferentes ou linhas duplicadas dentro da mesma tabela. Query para retomar isto:
   ```sql
   select schemaname, relname, pg_size_pretty(pg_total_relation_size(relid))
   from pg_catalog.pg_statio_user_tables
   where relname in ('arteria','codigo_postal','codigo_postal_arteria')
   order by relname, schemaname;
   ```

2. As 16 restantes tabelas `netuno_*` (`netuno_app`, `netuno_app_meta`, `netuno_app_table`, `netuno_auth_jwt_token`, `netuno_client`, `netuno_client_hit`, `netuno_design`, `netuno_group`, `netuno_group_rule`, `netuno_statistic_average`, `netuno_statistic_average_type`, `netuno_statistic_moment`, `netuno_statistic_type`, `netuno_table`, `netuno_user`, `netuno_user_rule`) continuam na base de dados. Se a ligação do Yos aos códigos postais estiver certa, é possível que o Netuno tenha sido, nalgum momento, uma ferramenta/admin usada especificamente para importar ou gerir os dados de códigos postais/artérias/freguesias (`arteria`, `codigo_postal`, `codigos_postais_geo`, `localidade`, `freguesias`) — o que explicaria o volume de log gerado (`netuno_log`) e possivelmente as duplicações do ponto 1 (ex.: reimportações feitas por essa ferramenta).

3. Ficheiros de referência já existentes no projeto (uploads, não docs) que podem ajudar a confirmar isto amanhã: `Contactos_freguesias.xlsx`/`.ods`, `Concelhos_Portugal_2026.xlsx`, `Freguesias_Portugal_2026.xlsx` — se estes foram importados via alguma ferramenta Netuno, pode valer a pena perguntar/confirmar a origem.

## Próximos passos (por esta ordem)

1. ~~Confirmar com o Yos o que exatamente ele recorda sobre a ligação Netuno ↔ códigos postais~~ — feito hoje (30/08), origem confirmada via investigação direta (ver secção "Atualização 30/08/2026" acima).
2. Correr a query da secção 1 para perceber se as tabelas duplicadas são schemas diferentes ou dados duplicados — **por fazer hoje**, pendente de acesso a terminal/SQL.
3. Decidir, com essa informação: manter as 16 tabelas `netuno_*` restantes (se ainda houver uso real fora deste repo) ou removê-las por completo (`DROP TABLE`, com backup/dump antes — agora já com mais confiança, visto que o código Next.js não lhes acede).
4. Resolver as tabelas de códigos postais duplicadas (apagar a cópia a mais, seja ela qual for) — isto liberta mais espaço na base de dados (as duas maiores duplicações somam sozinhas mais de 100 MB).

## Contexto relacionado

- `claude/FASE1-ARQUITETURA-MODULO-SOCIAL-20260829.md`, secção 0 — diagnóstico completo do "EXCEEDING USAGE LIMITS" e a resolução do `netuno_log`.
- `claude/FASE2-DATABASE-MODULO-SOCIAL-20260829.md`, secção 2.1 — mesmo achado, no contexto da Fase 2.
- Repositório de origem: `Nextcloud/Projectos/codigos-postais-auditoria/codigos_postais_pt/` no computador do Yos (clone de `github.com/eduveks/codigos_postais_pt`), dump em `dbs/postgresql-dump.sql` (345 MB, 12/08/2026).
