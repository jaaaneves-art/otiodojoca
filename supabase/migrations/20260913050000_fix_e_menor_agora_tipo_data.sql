-- ============================================================
-- FIX: e_menor_agora() — comparação de tipos inválida
--
-- A versão em 20260912230000_minors_policy_rgpd.sql fazia:
--   (CURRENT_DATE - v_data_nascimento) < '18 years'::interval
-- Em Postgres, date - date devolve integer (dias), não interval,
-- pelo que a função lançava SQLSTATE 42883 sempre que o perfil
-- tinha data_nascimento preenchida. Isso partia todas as RPC que
-- dependem dela (social_comentario_criar, marketplace_ad_criar).
-- Detectado por tests/e2e/social-complete.e2e.test.ts.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.e_menor_agora()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_data_nascimento date;
BEGIN
  SELECT data_nascimento INTO v_data_nascimento
  FROM public.profiles WHERE id = auth.uid();

  IF v_data_nascimento IS NULL THEN
    RETURN true;  -- sem data, assume menor (conservador)
  END IF;

  RETURN v_data_nascimento > (CURRENT_DATE - INTERVAL '18 years');
END;
$$;

COMMIT;
