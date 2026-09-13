-- Alarga marketplace_ad_editar() para aceitar category_id/location/
-- details, para poder finalmente fechar o bypass de RLS em
-- marketplace_ads (ver docs/planos/20260913T0945-plano-sessao.md,
-- secção "P0 NOVO — bypass real do RPC-only writes de hoje cedo").
--
-- A versão original (20260913020000) só aceitava title/description --
-- muito menos do que retailing/beleza/mediacao/consultorio-actions.ts
-- atualizam. category_id/location/details usam COALESCE(parâmetro,
-- valor atual) em vez de sobrescrever sempre, porque
-- consultorio-actions.ts não envia category_id (categoria fixa por
-- desenho) -- sem o COALESCE, editar um consultório apagaria a sua
-- categoria.

BEGIN;

DROP FUNCTION IF EXISTS public.marketplace_ad_editar(integer, text, text);

CREATE FUNCTION public.marketplace_ad_editar(
  p_ad_id integer,
  p_title text,
  p_description text,
  p_category_id integer DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.marketplace_ads
  SET title = p_title,
      description = p_description,
      category_id = COALESCE(p_category_id, category_id),
      location = COALESCE(p_location, location),
      details = COALESCE(p_details, details),
      updated_at = now()
  WHERE id = p_ad_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_ad_editar(integer, text, text, integer, text, jsonb) TO authenticated;

COMMIT;
