-- ============================================================
-- RLS REFACTOR: marketplace_ads — 3 RPC + Minors Policy
-- ============================================================

BEGIN;

-- 1. CRIAR ANÚNCIO
CREATE OR REPLACE FUNCTION public.marketplace_ad_criar(
  p_title text,
  p_description text,
  p_type text,
  p_details jsonb,
  p_category_id integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ad_id integer;
BEGIN
  IF public.e_menor_agora() AND NOT public.pode_publicar_fora_grupo() THEN
    RAISE EXCEPTION 'Menores de 18 não podem publicar anúncios fora de grupos';
  END IF;

  INSERT INTO public.marketplace_ads (author_id, title, description, type, details, category_id, status)
  VALUES (auth.uid(), p_title, p_description, p_type, p_details, p_category_id, 'active')
  RETURNING id INTO v_ad_id;

  RETURN v_ad_id;
END;
$$;

-- 2. EDITAR ANÚNCIO
CREATE OR REPLACE FUNCTION public.marketplace_ad_editar(
  p_ad_id integer,
  p_title text,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.marketplace_ads
  SET title = p_title, description = p_description, updated_at = now()
  WHERE id = p_ad_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- 3. APAGAR ANÚNCIO
CREATE OR REPLACE FUNCTION public.marketplace_ad_apagar(p_ad_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.marketplace_ads
  SET status = 'deleted', updated_at = now()
  WHERE id = p_ad_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================
-- POLICIES — RPC ONLY
-- ============================================================

DROP POLICY IF EXISTS marketplace_ads_insert ON public.marketplace_ads;
CREATE POLICY marketplace_ads_insert ON public.marketplace_ads
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS marketplace_ads_update ON public.marketplace_ads;
CREATE POLICY marketplace_ads_update ON public.marketplace_ads
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS marketplace_ads_delete ON public.marketplace_ads;
CREATE POLICY marketplace_ads_delete ON public.marketplace_ads
  FOR DELETE USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.marketplace_ad_criar(text, text, text, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_ad_editar(integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_ad_apagar(integer) TO authenticated;

COMMIT;
