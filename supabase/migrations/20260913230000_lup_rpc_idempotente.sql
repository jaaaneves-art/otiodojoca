-- LUP only: preserve existing generic RPC signatures and RPC-only grants.
BEGIN;
ALTER TABLE public.marketplace_ads ADD COLUMN lup_request_id uuid;
CREATE UNIQUE INDEX marketplace_ads_lup_request_unique
  ON public.marketplace_ads(author_id, lup_request_id)
  WHERE module = 'lup' AND lup_request_id IS NOT NULL;

CREATE FUNCTION public.lup_ad_guardar(p_data jsonb, p_request_id uuid, p_ad_id integer DEFAULT NULL)
RETURNS TABLE(ad_id integer, created boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id integer;
  v_type text := p_data->>'type';
  v_price numeric;
  v_category integer;
  v_details jsonb := p_data->'details';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501'; END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
  IF public.e_menor_agora() AND NOT public.pode_publicar_fora_grupo() THEN
    RAISE EXCEPTION 'Não pode publicar anúncios fora de grupos' USING ERRCODE = '42501';
  END IF;
  IF p_ad_id IS NULL THEN
    -- Serialize identical requests, including simultaneous HTTP retries.
    PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text || p_request_id::text, 0));
    SELECT a.id INTO v_id FROM public.marketplace_ads a
      WHERE a.author_id = v_user AND a.module = 'lup' AND a.lup_request_id = p_request_id;
    IF FOUND THEN RETURN QUERY SELECT v_id, false; RETURN; END IF;
  ELSE
    PERFORM 1 FROM public.marketplace_ads a
      WHERE a.id = p_ad_id AND a.author_id = v_user AND a.module = 'lup' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Anúncio inexistente ou sem permissão' USING ERRCODE = '42501'; END IF;
  END IF;
  IF v_type IS NULL OR v_type NOT IN ('oferta','venda','procura')
    OR NULLIF(btrim(p_data->>'title'), '') IS NULL
    OR NULLIF(btrim(p_data->>'description'), '') IS NULL
    OR NULLIF(btrim(p_data->>'location'), '') IS NULL
    OR (p_data->>'contact_method') IS NULL
    OR (p_data->>'contact_method') NOT IN ('message','phone','email') THEN
    RAISE EXCEPTION 'Preencha os campos obrigatórios do anúncio';
  END IF;
  v_category := (p_data->>'category_id')::integer;
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = v_category AND type = 'lup') THEN
    RAISE EXCEPTION 'Categoria LUP inválida';
  END IF;
  IF v_details IS NULL OR jsonb_typeof(v_details) <> 'object' THEN RAISE EXCEPTION 'Detalhes inválidos'; END IF;
  IF v_type IN ('oferta','venda') THEN
    IF NULLIF(v_details->>'quantity','') IS NULL OR (v_details->>'quantity')::numeric <= 0
      OR (v_details->>'quantity')::numeric >= 'Infinity'::numeric
      OR NULLIF(btrim(v_details->>'unit'),'') IS NULL
      OR NULLIF(v_details->>'pickup_ends_at','') IS NULL THEN
      RAISE EXCEPTION 'Quantidade, unidade e prazo de recolha são obrigatórios';
    END IF;
    IF NOT isfinite((v_details->>'pickup_ends_at')::timestamptz)
      OR (NULLIF(v_details->>'pickup_starts_at','') IS NOT NULL AND
          (NOT isfinite((v_details->>'pickup_starts_at')::timestamptz) OR
           (v_details->>'pickup_starts_at')::timestamptz > (v_details->>'pickup_ends_at')::timestamptz)) THEN
      RAISE EXCEPTION 'Janela de recolha inválida';
    END IF;
  END IF;
  IF v_type = 'venda' THEN
    v_price := (p_data->>'price')::numeric;
    IF v_price IS NULL OR v_price < 0 OR v_price >= 'Infinity'::numeric THEN RAISE EXCEPTION 'Preço inválido'; END IF;
  END IF;
  IF v_type = 'procura' THEN v_details := '{}'::jsonb; END IF;
  IF p_ad_id IS NULL THEN
    INSERT INTO public.marketplace_ads(author_id,module,title,description,type,category_id,location,
      contact_method,price_type,price,status,details,lup_request_id)
    VALUES(v_user,'lup',btrim(p_data->>'title'),btrim(p_data->>'description'),v_type,v_category,
      btrim(p_data->>'location'),p_data->>'contact_method',
      CASE v_type WHEN 'oferta' THEN 'free' WHEN 'venda' THEN 'fixed' ELSE NULL END,
      v_price,'active',v_details,p_request_id) RETURNING id INTO v_id;
    RETURN QUERY SELECT v_id, true;
  ELSE
    UPDATE public.marketplace_ads SET title=btrim(p_data->>'title'),description=btrim(p_data->>'description'),
      type=v_type,category_id=v_category,location=btrim(p_data->>'location'),contact_method=p_data->>'contact_method',
      price_type=CASE v_type WHEN 'oferta' THEN 'free' WHEN 'venda' THEN 'fixed' ELSE NULL END,
      price=v_price,details=v_details,updated_at=now() WHERE id=p_ad_id;
    RETURN QUERY SELECT p_ad_id, false;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.lup_ad_guardar(jsonb,uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lup_ad_guardar(jsonb,uuid,integer) TO authenticated;
COMMIT;
