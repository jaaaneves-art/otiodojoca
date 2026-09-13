BEGIN;

-- ============================================================
-- Alarga marketplace_ad_criar com p_location (morada), que os
-- formulários de beleza/mediação/consultório/retailing sempre
-- preenchem mas a versão original da RPC (20260913020000) não
-- aceitava — o campo ficava a null ao trocar o insert direto
-- pela chamada à RPC.
-- ============================================================

DROP FUNCTION IF EXISTS public.marketplace_ad_criar(text, text, text, jsonb, integer);

CREATE FUNCTION public.marketplace_ad_criar(
  p_title text,
  p_description text,
  p_type text,
  p_details jsonb,
  p_location text DEFAULT NULL,
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

  INSERT INTO public.marketplace_ads (author_id, title, description, type, details, location, category_id, status)
  VALUES (auth.uid(), p_title, p_description, p_type, p_details, p_location, p_category_id, 'active')
  RETURNING id INTO v_ad_id;

  RETURN v_ad_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_ad_criar(text, text, text, jsonb, text, integer) TO authenticated;

-- ============================================================
-- Alarga restaurante_reserva_criar com p_telefone e
-- p_observacoes, recolhidos pelo formulário de reserva mas
-- ausentes da versão original da RPC (20260913030000).
-- ============================================================

DROP FUNCTION IF EXISTS public.restaurante_reserva_criar(bigint, text, text, date, time, bigint);

CREATE FUNCTION public.restaurante_reserva_criar(
  p_restaurante_id bigint,
  p_nome_cliente text,
  p_email_cliente text,
  p_data_reserva date,
  p_hora_reserva time,
  p_numero_pessoas bigint,
  p_telefone text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reserva_id bigint;
BEGIN
  INSERT INTO public.restaurante_reservas (
    restaurante_id, user_id, nome_cliente, email_cliente,
    data_reserva, hora_reserva, numero_pessoas, telefone, observacoes
  )
  VALUES (
    p_restaurante_id, auth.uid(), p_nome_cliente, p_email_cliente,
    p_data_reserva, p_hora_reserva, p_numero_pessoas, p_telefone, p_observacoes
  )
  RETURNING id INTO v_reserva_id;

  RETURN v_reserva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restaurante_reserva_criar(bigint, text, text, date, time, bigint, text, text) TO authenticated;

COMMIT;
