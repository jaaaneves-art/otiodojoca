# OTJ — Estado intermédio da sessão

## Objetivo

Registar o estado efetivamente alcançado nesta sessão e impedir repetição de
auditorias, migrations, correções e testes já executados.

## Concluído — NÃO REPETIR

### LUP

- Migração de criação/edição para RPC `lup_ad_guardar`.
- Escrita direta em `marketplace_ads` bloqueada no cenário validado.
- Proteção contra submissões duplicadas/idempotência implementada.
- Testes focados LUP aprovados: 17/17.
- E2E local real validou:
  - autenticação;
  - criação;
  - idempotência;
  - apenas 1 anúncio criado;
  - escrita direta bloqueada.
- Resultado final: `LUP_E2E_OK`.
- Não repetir estas validações sem alteração posterior relevante.

### Empregos

- `job_admin_definir_estado` implementada.
- `job_editar` alargada para os campos reais do formulário.
- RPCs posteriores instaladas localmente:
  - `job_criar`;
  - `job_fechar`;
  - `job_publicar`;
  - `job_pausar`;
  - `job_reabrir`.
- `e_admin()` canónica instalada localmente.
- Policies de `jobs` corrigidas para modelo RPC-only.
- Escrita direta INSERT/UPDATE/DELETE protegida pelas policies RPC-only.
- E2E final:
  - 1 ficheiro de testes aprovado;
  - 10/10 testes aprovados;
  - ciclo `publicar → pausar → fechar → reabrir → publicar` aprovado.
- Não repetir migrations ou auditorias anteriores de Empregos sem nova evidência.

### E2E RPC-only geral

O teste final `tests/e2e/rpc-only-writes.e2e.test.ts` terminou com 10/10 testes
aprovados, incluindo Jobs, Marketplace e Reservas.

Este resultado deve ser considerado antes de voltar a propor correções RPC-only
já abrangidas por este teste.

## Repetições/duplicações identificadas

- Existem gerações diferentes das migrations/RPCs de Empregos.
- Não aplicar migrations antigas por ordem isoladamente sem verificar se foram
  substituídas por versões posteriores.
- `job_editar` já tem versão posterior alargada.
- `job_criar` e RPCs de estado já têm versão posterior.
- `e_admin()` deve usar a versão canónica que verifica:
  - `profiles.role = 'admin'`;
  - `deleted_at IS NULL`.
- Algumas migrations foram aplicadas manualmente via `psql` à BD local e podem
  não constar de `supabase_migrations.schema_migrations`.
- Ausência no histórico de migrations NÃO significa automaticamente que a
  alteração não esteja presente no schema local.

## Pendências reais conhecidas

### LUP — fotografias / Storage

A gravação do anúncio e o upload/registo das fotografias não constituem uma
única transação.

Possíveis situações de falha:
- anúncio criado sem fotografia;
- objeto no Storage sem metadata correspondente;
- objeto órfão após falha intermédia.

Esta pendência não invalida a conclusão do RPC-only/idempotência do anúncio.

### Marketplace

Antes de considerar qualquer módulo Marketplace como pendente, reconciliar o
estado atual do código, migrations, documentação e E2E.

Não assumir que Gran Bazar, Mercado da Terra, Imóveis ou Viaturas precisam de
nova implementação apenas porque apareceram numa auditoria anterior.

O teste E2E RPC-only geral terminou 10/10; verificar primeiro o alcance real das
alterações já feitas nesta sessão para evitar repetição.

### Escutismo

Foi analisado durante a sessão, mas o estado final deve ser reconciliado com os
documentos e código atuais antes de declarar tarefas concretas como pendentes.

## Restrições / decisões

- Não fazer `push` sem autorização explícita.
- Não fazer `db push`.
- Não fazer reset/drop da BD.
- Não aplicar alterações em produção.
- Preservar alterações já existentes no working tree.
- Trabalhar primeiro no Supabase local quando for necessária validação.
- Não repetir testes/auditorias já aprovados sem alteração relevante que os
  justifique.

## Próximo passo concreto

1. Reconciliar o que foi efetivamente concluído hoje no Marketplace RPC-only.
2. Confirmar o estado de Escutismo.
3. Atualizar documentação/registos apenas com factos verificados.
4. Quando o utilizador indicar o fim da sessão, criar o documento FINAL de
   pendências e o relatório em `docs/sessions/`, sem transportar tarefas já
   concluídas como pendentes.

## Estado

**Evolução**, com atenção explícita a **Repetição/duplicação**.

Este documento é intermédio e NÃO representa o encerramento da sessão.
