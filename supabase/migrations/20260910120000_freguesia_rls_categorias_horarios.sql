-- Três tabelas do módulo Freguesia (categorias_entidade, horarios,
-- horarios_excecoes) têm RLS ativo (desde a migração que as criou) mas
-- nunca tiveram uma policy — GRANT de tabela não passa por cima de RLS,
-- por isso ficam fechadas a "anon"/"authenticated" apesar do GRANT já
-- existente. Isto bloqueia silenciosamente:
--   - lib/freguesia/actions.ts:getCategorias() (usado pelo filtro de
--     categorias na página /freguesia/[slug], já em produção);
--   - os embeds horarios(*) e horarios_excecoes(*) em
--     lib/freguesia/actions.ts:getEntidadeBySlug() (usado pela nova
--     página /entidades/[slug]).
-- Mesmo padrão da correção em 20260906091000_rls_tabelas_culturas.sql.

-- Idempotente: pelo menos "categorias_entidade_public_read" já existia na
-- base remota (provavelmente criada à mão no SQL Editor antes desta
-- migration ter sido escrita) -- o db push original falhou aqui com
-- "policy already exists" (42710) e abortou a transação inteira antes de
-- chegar às outras duas.
DROP POLICY IF EXISTS categorias_entidade_public_read ON public.categorias_entidade;
CREATE POLICY categorias_entidade_public_read ON public.categorias_entidade
  FOR SELECT
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS horarios_public_read ON public.horarios;
CREATE POLICY horarios_public_read ON public.horarios
  FOR SELECT
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS horarios_excecoes_public_read ON public.horarios_excecoes;
CREATE POLICY horarios_excecoes_public_read ON public.horarios_excecoes
  FOR SELECT
  TO PUBLIC
  USING (true);
