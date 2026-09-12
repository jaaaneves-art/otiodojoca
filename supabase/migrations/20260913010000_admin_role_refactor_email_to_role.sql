-- ============================================================
-- ADMIN ROLE REFACTOR — de @otj.pt para e_admin() role
-- ============================================================

BEGIN;

-- Função genérica de admin (baseada em role, não email)
CREATE OR REPLACE FUNCTION public.e_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$;

-- Atualizar policies que usavam @otj.pt email
DROP POLICY IF EXISTS alojamentos_insert ON public.alojamentos;
CREATE POLICY alojamentos_insert ON public.alojamentos
  FOR INSERT WITH CHECK (public.e_admin());

DROP POLICY IF EXISTS comercios_insert ON public.comercios;
CREATE POLICY comercios_insert ON public.comercios
  FOR INSERT WITH CHECK (public.e_admin());

DROP POLICY IF EXISTS restaurantes_insert ON public.restaurantes;
CREATE POLICY restaurantes_insert ON public.restaurantes
  FOR INSERT WITH CHECK (public.e_admin());

COMMIT;
