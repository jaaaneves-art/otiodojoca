-- Convergência do padrão de admin. Decisão de 13/09/2026 (ver
-- docs/pendentes/PENDENTES-20260913.md, secção "Decisões em aberto", e
-- docs/planos/20260913T0945-plano-sessao.md, secção "P2 — Convergir
-- padrões de admin").
--
-- Levantamento antes de mexer:
--   - Hoje NÃO existe nenhum profile com role='admin' nem com
--     is_admin=true (confirmado por SELECT direto). Zero risco de
--     divergência de dados reais neste momento.
--   - e_admin()            -> profiles.role='admin', sem checar deleted_at
--   - diaspora_is_admin()  -> profiles.role='admin' AND deleted_at IS NULL
--   - pet_is_admin()       -> profiles.is_admin=true AND deleted_at IS NULL
--     (coluna DIFERENTE — is_admin, não role). Confirmado por grep em
--     app/ e lib/: NADA no código da app alguma vez define is_admin=true;
--     a única referência fora desta migração é um teste que só verifica
--     o texto-fonte da migração (tests/pets/security.test.mjs), não um
--     fluxo real. Ou seja, a moderação de Pets estava, na prática,
--     inacessível — não só duplicação, um caminho morto.
--   - 4 policies com EXISTS(...profiles.role='admin') inline, idêntico a
--     e_admin(): audit_log, entidade_pedidos, job_reports, jobs.
--   - reservas_alojamento usa 'moderator OU admin' — âmbito genuinamente
--     mais lato, fica de fora desta convergência (não é duplicação).
--   - Fora de âmbito, por serem conceitos diferentes (papel por
--     entidade/grupo, não admin global): e_admin_grupo(),
--     is_event_org_member(), is_group_manager(), event_organization_members,
--     group_members.
--
-- Decisão do Yos: convergência completa.
--   1. e_admin() passa a excluir deleted_at (fica ao nível do
--      diaspora_is_admin() — mais correto: um admin apagado não deve
--      manter privilégios).
--   2. diaspora_is_admin() e pet_is_admin() passam a wrappers finos de
--      e_admin(). pet_is_admin() deixa de olhar para is_admin e passa a
--      olhar para role='admin' — corrige o caminho morto.
--   3. As 4 policies inline duplicadas passam a chamar e_admin().
--   4. reservas_alojamento não é tocada.

-- 1. e_admin() — adiciona deleted_at IS NULL
CREATE OR REPLACE FUNCTION public.e_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role AND deleted_at IS NULL
  );
END;
$function$;

-- 2a. diaspora_is_admin() — wrapper fino de e_admin()
CREATE OR REPLACE FUNCTION public.diaspora_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.e_admin();
$function$;

-- 2b. pet_is_admin() — wrapper fino de e_admin(); deixa de olhar para
-- is_admin (coluna nunca definida por código nenhum) e passa a olhar
-- para role='admin', igual a todo o resto da plataforma.
CREATE OR REPLACE FUNCTION public.pet_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.e_admin();
$function$;

-- 3. Policies com EXISTS(...profiles.role='admin') inline -> e_admin()

DROP POLICY IF EXISTS "audit_log_select_own" ON public.audit_log;
CREATE POLICY "audit_log_select_own" ON public.audit_log
  FOR SELECT
  USING ((auth.uid() = user_id) OR public.e_admin());

DROP POLICY IF EXISTS "Administradores gerem todos os pedidos" ON public.entidade_pedidos;
CREATE POLICY "Administradores gerem todos os pedidos" ON public.entidade_pedidos
  FOR ALL
  TO authenticated
  USING (public.e_admin())
  WITH CHECK (public.e_admin());

DROP POLICY IF EXISTS "Administradores gerem todas as denuncias" ON public.job_reports;
CREATE POLICY "Administradores gerem todas as denuncias" ON public.job_reports
  FOR ALL
  TO authenticated
  USING (public.e_admin())
  WITH CHECK (public.e_admin());

DROP POLICY IF EXISTS "Administradores gerem todas as vagas" ON public.jobs;
CREATE POLICY "Administradores gerem todas as vagas" ON public.jobs
  FOR ALL
  TO authenticated
  USING (public.e_admin())
  WITH CHECK (public.e_admin());
