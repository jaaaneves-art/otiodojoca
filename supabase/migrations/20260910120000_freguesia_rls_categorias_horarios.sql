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

CREATE POLICY categorias_entidade_public_read ON public.categorias_entidade
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY horarios_public_read ON public.horarios
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY horarios_excecoes_public_read ON public.horarios_excecoes
  FOR SELECT
  TO PUBLIC
  USING (true);
