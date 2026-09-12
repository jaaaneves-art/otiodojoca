-- ============================================================
-- MINORS POLICY (18-) — RGPD
-- Menores de 18 NÃO PODEM publicar fora de grupos aprovados
-- ============================================================

BEGIN;

-- 1. FUNÇÃO: é menor agora?
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
    RETURN true;  -- Sem data, assume menor (conservador)
  END IF;

  RETURN (CURRENT_DATE - v_data_nascimento) < '18 years'::interval;
END;
$$;

-- 2. FUNÇÃO: pode publicar fora de grupo?
CREATE OR REPLACE FUNCTION public.pode_publicar_fora_grupo()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Adulto (18+) sempre pode
  IF NOT public.e_menor_agora() THEN
    RETURN true;
  END IF;

  -- Menor: só se estiver em algum grupo aprovado
  RETURN EXISTS (
    SELECT 1 FROM public.adesoes
    WHERE profile_id = auth.uid()
      AND estado = 'aprovada'
  );
END;
$$;

-- 3. POLÍTICA: social_posts — menores BLOQUEADOS fora de grupos
DROP POLICY IF EXISTS social_posts_minors_check ON public.social_posts;
CREATE POLICY social_posts_minors_check ON public.social_posts
  FOR INSERT WITH CHECK (
    CASE 
      WHEN public.e_menor_agora() THEN public.pode_publicar_fora_grupo()
      ELSE true
    END
  );

-- 4. POLÍTICAS: marketplace — mesma regra
DROP POLICY IF EXISTS marketplace_ads_minors_check ON public.marketplace_ads;
CREATE POLICY marketplace_ads_minors_check ON public.marketplace_ads
  FOR INSERT WITH CHECK (
    CASE 
      WHEN public.e_menor_agora() THEN public.pode_publicar_fora_grupo()
      ELSE true
    END
  );

COMMENT ON FUNCTION public.e_menor_agora() IS 'Retorna true se o utilizador tem < 18 anos (baseado em data_nascimento)';
COMMENT ON FUNCTION public.pode_publicar_fora_grupo() IS 'Retorna true se pode publicar fora de grupos (adultos sempre, menores só se em grupo aprovado)';

COMMIT;
