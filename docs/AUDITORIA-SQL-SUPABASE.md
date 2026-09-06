# Auditoria `sql/` vs `supabase/schemas/`

**Data da auditoria:** 6 de setembro de 2026

## Objetivo

Esta auditoria foi realizada no âmbito da issue #1:

> Comparar os ficheiros históricos existentes em `sql/` com o schema
> declarativo atual em `supabase/schemas/`, documentar diferenças,
> identificar SQL desatualizado e determinar se são necessárias
> migrations adicionais.

A comparação incluiu:

- tabelas;
- colunas;
- índices;
- Row Level Security (RLS);
- políticas RLS;
- funções;
- triggers;
- migrations existentes.

## Resumo

Foram identificadas:

- **16 tabelas** nos SQL históricos em `sql/`;
- **87 tabelas** no schema Supabase analisado;
- **17 tabelas `netuno_*`**, consideradas legado;
- **70 tabelas ativas**, excluindo Netuno;
- **16/16 tabelas históricas** presentes no schema atual;
- **0 tabelas históricas exclusivamente em `sql/`**.

Consequentemente, não foi identificada qualquer tabela histórica cuja
ausência, por si só, justifique uma nova migration.

## Netuno

As tabelas cujo nome começa por `netuno_` pertencem ao sistema Netuno.

O Netuno **não está atualmente em utilização neste projeto**.

Por esse motivo, estes objetos são classificados como **legado** e não
devem ser considerados automaticamente dependências ativas nem motivo
para criação de novas migrations.

Foram identificadas 17 tabelas deste tipo:

- `netuno_app`
- `netuno_app_meta`
- `netuno_app_table`
- `netuno_auth_jwt_token`
- `netuno_client`
- `netuno_client_hit`
- `netuno_design`
- `netuno_group`
- `netuno_group_rule`
- `netuno_log`
- `netuno_statistic_average`
- `netuno_statistic_average_type`
- `netuno_statistic_moment`
- `netuno_statistic_type`
- `netuno_table`
- `netuno_user`
- `netuno_user_rule`

A eventual remoção física destas tabelas da base de dados deverá ser
tratada separadamente e nunca executada apenas com base nesta auditoria.

## Cobertura das tabelas históricas

Todas as tabelas encontradas em `sql/` estão representadas no schema
Supabase atual:

- `alojamentos`
- `categorias_entidade`
- `codigos_postais_geo`
- `culturas_guia`
- `entidade_relacoes`
- `entidades`
- `eventos`
- `horarios`
- `horarios_excecoes`
- `localizacoes`
- `plantacao_historico`
- `plantacoes`
- `refeicoes_alojamento`
- `reservas_alojamento`
- `restaurantes`
- `tipos_alojamento`

Assim:

**não existem tabelas históricas presentes apenas em `sql/`.**

## Diferenças de colunas

A comparação automática identificou inicialmente várias possíveis
diferenças.

Algumas revelaram-se falsos positivos.

### `categorias_entidade`

Os valores:

- `church`
- `shop`

não são colunas.

Aparecem nos SQL históricos como exemplos ou valores associados ao campo
`icone`.

Não representam perda de estrutura no schema atual.

### `entidades`

`instagram` também não corresponde a uma coluna histórica independente.

Surge como exemplo de conteúdo do campo JSONB `redes_sociais`.

Não existe, portanto, evidência de uma coluna `instagram` perdida durante
a evolução do schema.

### Renomeação de timestamps

Foram encontradas diferenças como:

- `created_at` → `criado_em`
- `updated_at` → `atualizado_em`

em tabelas agrícolas.

Estas diferenças correspondem à evolução/nomenclatura do schema e não
devem ser interpretadas automaticamente como colunas desaparecidas.

### `culturas_guia.meses_poda`

Esta é uma diferença real que merece ficar documentada.

O SQL histórico `sql/AGENDA_AGRICOLA.sql` contém:

`meses_poda`

e `sql/culturas_guia_seed.sql` também referencia esse campo.

A coluna não foi encontrada na pesquisa realizada sobre o schema/migrations
atuais.

Isto não implica que deva ser recriada automaticamente.

Antes de qualquer alteração futura deve confirmar-se se a funcionalidade
atual ainda necessita deste campo ou se ele foi deliberadamente substituído
durante a evolução da agenda agrícola.

## Índices históricos

Foram encontrados índices históricos que não foram detetados com o mesmo
nome no schema declarativo atual.

Entre eles:

- `idx_culturas_guia_categoria`
- `idx_relacoes_tipo`
- `idx_eventos_estado`
- `idx_eventos_tipo`
- `idx_excecoes_data`
- `idx_plantacao_historico_plantacao_id`
- `idx_plantacoes_cultura_id`
- `idx_plantacoes_data_plantacao`
- `idx_plantacoes_estado`
- `idx_plantacoes_utilizador_id`

A ausência destes nomes no schema atual **não significa automaticamente
um erro**.

Os índices podem ter sido:

- removidos intencionalmente;
- substituídos;
- renomeados;
- tornados redundantes pela evolução do modelo;
- incorporados noutras estratégias de indexação.

Não deve ser criada uma migration apenas para restaurar estes índices
sem analisar primeiro as queries e os planos de execução utilizados pela
aplicação atual.

## Eventos

A constraint histórica `tipo_valido` da tabela `eventos` continua
representada no schema atual.

Foi igualmente encontrada na migration de schema remoto analisada.

Isto confirma que esta regra estrutural não foi perdida durante a
evolução do projeto.

## Row Level Security

A auditoria encontrou RLS ativo no schema atual.

As tabelas históricas em que o SQL antigo explicitamente ativava RLS
continuam representadas no modelo atual.

Foram observadas diferenças nos nomes das políticas de algumas tabelas,
incluindo:

- `culturas_guia`;
- `plantacao_historico`;
- `plantacoes`;
- `reservas_alojamento`;
- `restaurante_reservas`.

A comparação efetuada foi baseada sobretudo na identificação estática
dos nomes das policies.

Uma policy com nome diferente não significa necessariamente que a
proteção tenha desaparecido.

Por isso, as diferenças de nomes não são consideradas prova suficiente
para recriar policies históricas.

Qualquer alteração futura de RLS deve comparar a expressão `USING`,
`WITH CHECK`, roles e operações permitidas, e não apenas o nome da policy.

## Funções e triggers

Os SQL históricos analisados não introduzem funções ou triggers que
tenham sido identificados como estando em falta.

O schema atual contém funções e triggers adicionais resultantes da
evolução posterior da aplicação.

Esses objetos não constituem divergência problemática relativamente aos
SQL históricos.

## Ficheiros em `sql/`

A pasta `sql/` deve ser considerada **histórica/legada**, e não a fonte
de verdade atual do schema.

A fonte de verdade para a evolução da base de dados deve continuar a ser:

- `supabase/migrations/`
- `supabase/schemas/`

Os ficheiros em `sql/` podem continuar no repositório como referência
histórica enquanto forem úteis.

Não devem ser reaplicados indiscriminadamente sobre uma base de dados
atual.

Uma eventual remoção ou transferência destes ficheiros para arquivo pode
ser feita numa tarefa separada.

## Decisão sobre sincronização

A auditoria **não encontrou justificação para criar uma migration geral
destinada a sincronizar `sql/` com `supabase/schemas/`**.

Em particular:

1. todas as 16 tabelas históricas continuam representadas;
2. o schema atual contém numerosas evoluções posteriores;
3. várias diferenças inicialmente identificadas eram falsos positivos;
4. outras diferenças correspondem a renomeações/evolução do modelo;
5. `meses_poda` fica documentado para eventual avaliação funcional;
6. índices históricos não devem ser recriados sem evidência de necessidade;
7. Netuno é legado e não está em utilização.

## Recomendações

### Manter

Manter `supabase/migrations/` e `supabase/schemas/` como mecanismos atuais
de controlo e evolução do schema.

### Não executar automaticamente

Não executar novamente os SQL de `sql/` sobre produção.

Não recriar automaticamente colunas, policies ou índices apenas porque
existiam nos SQL históricos.

### Avaliar futuramente

Se a agenda agrícola voltar a necessitar da funcionalidade de poda,
avaliar especificamente `culturas_guia.meses_poda`.

Se forem identificados problemas de performance, analisar os índices
históricos relevantes com `EXPLAIN`/`EXPLAIN ANALYZE` antes de decidir
pela sua reintrodução.

### Netuno

Manter os objetos Netuno classificados como legado.

Qualquer remoção definitiva deve ser objeto de uma tarefa própria,
incluindo verificação de dependências e backup antes de `DROP`.

## Conclusão

A auditoria da issue #1 está concluída.

Os SQL históricos foram comparados com o schema declarativo atual.

**Não foi identificada nenhuma tabela histórica em falta no schema
Supabase atual e não existe fundamento para criar uma migration geral
de sincronização.**

As diferenças encontradas foram documentadas e devem ser tratadas como
evolução histórica ou analisadas individualmente quando existir uma
necessidade funcional ou de performance concreta.

A pasta `sql/` deixa, assim, de ser ambígua quanto ao seu papel:
é documentação/referência histórica, enquanto a evolução atual da base
de dados é controlada pelo workflow Supabase.
