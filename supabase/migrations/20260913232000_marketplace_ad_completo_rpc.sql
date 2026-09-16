-- Novo par de RPC "completo" para Gran Bazar, Mercado da Terra, Imóveis e
-- Viaturas — os 4 módulos cujas páginas novo/editar ainda faziam INSERT/
-- UPDATE direto em marketplace_ads (confirmado por leitura de código em
-- 20260913T2110-plano-reconciliacao-continuacao.md e no plano das 17:49,
-- docs/planos/20260913T1749-plano-continuacao-otj.md).
--
-- Desde 20260913180000_fechar_bypass_marketplace_ads.sql, INSERT/UPDATE/
-- DELETE/TRUNCATE está revogado de "authenticated" em marketplace_ads. Sem
-- esta RPC, criar/editar anúncios nestes 4 módulos falha (RLS/grant) em
-- qualquer ambiente onde essa migration já esteja aplicada.
--
-- Não reaproveita marketplace_ad_criar()/marketplace_ad_editar() (usadas só
-- por retailing/beleza/mediacao/consultorio) porque esses 4 módulos de
-- serviços nunca definem price/price_type/contact_method/type/module — e
-- Gran Bazar/Mercado da Terra/Imóveis/Viaturas precisam de poder GRAVAR
-- price/price_type como null ao mudar de tipo de anúncio (ex.: venda ->
-- troca). Sobrecarregar as funções partilhadas com COALESCE(parâmetro,
-- valor_atual) impediria essa limpeza e podia alterar sem necessidade o
-- comportamento já validado dos 4 módulos de serviços. Função nova e
-- explícita, no mesmo espírito de lup_ad_guardar() (20260913230000).
--
-- vehicle_make_id/model_id/generation_id/variant_id só entram em
-- marketplace_ad_criar_completo (INSERT) — nenhum dos 4 módulos, incluindo
-- Viaturas, atualiza estas colunas de catálogo ao editar hoje; a versão
-- "editar_completo" preserva esse comportamento exato (não as toca), para
-- não arriscar apagar a ligação ao catálogo de um anúncio existente sem
-- poder testar aqui.
--
-- AINDA NÃO APLICADA NEM TESTADA por esta sessão (sem terminal/Supabase
-- local disponível na ponte de ficheiros usada aqui). Preparada para
-- aplicação e validação local (equivalente ao que foi feito para o LUP:
-- backup, aplicar, testar cada tipo de anúncio incluindo o gatilho de
-- leilão, depois lint/build) antes de qualquer commit ou deploy.

BEGIN;

-- 1. CRIAR ANÚNCIO (Gran Bazar / Mercado da Terra / Imóveis / Viaturas)
CREATE FUNCTION public.marketplace_ad_criar_completo(
  p_module text,
  p_title text,
  p_description text,
  p_type text,
  p_details jsonb,
  p_location text,
  p_category_id integer,
  p_contact_method text,
  p_price numeric DEFAULT NULL,
  p_price_type text DEFAULT NULL,
  p_vehicle_make_id bigint DEFAULT NULL,
  p_vehicle_model_id bigint DEFAULT NULL,
  p_vehicle_generation_id bigint DEFAULT NULL,
  p_vehicle_variant_id bigint DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ad_id integer;
BEGIN
  IF p_module NOT IN ('gran-bazar', 'mercado-da-terra', 'imoveis', 'viaturas') THEN
    RAISE EXCEPTION 'marketplace_ad_criar_completo: módulo % não suportado', p_module;
  END IF;

  IF public.e_menor_agora() AND NOT public.pode_publicar_fora_grupo() THEN
    RAISE EXCEPTION 'Menores de 18 não podem publicar anúncios fora de grupos';
  END IF;

  INSERT INTO public.marketplace_ads (
    author_id, module, title, description, type, details, location,
    category_id, contact_method, price, price_type, status,
    vehicle_make_id, vehicle_model_id, vehicle_generation_id, vehicle_variant_id
  )
  VALUES (
    auth.uid(), p_module, p_title, p_description, p_type, p_details, p_location,
    p_category_id, p_contact_method, p_price, p_price_type, 'active',
    p_vehicle_make_id, p_vehicle_model_id, p_vehicle_generation_id, p_vehicle_variant_id
  )
  RETURNING id INTO v_ad_id;

  RETURN v_ad_id;
END;
$$;

-- 2. EDITAR ANÚNCIO (mesmos 4 módulos)
CREATE FUNCTION public.marketplace_ad_editar_completo(
  p_ad_id integer,
  p_module text,
  p_title text,
  p_description text,
  p_type text,
  p_details jsonb,
  p_location text,
  p_category_id integer,
  p_contact_method text,
  p_price numeric DEFAULT NULL,
  p_price_type text DEFAULT NULL
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
      type = p_type,
      details = p_details,
      location = p_location,
      category_id = p_category_id,
      contact_method = p_contact_method,
      price = p_price,
      price_type = p_price_type,
      updated_at = now()
  WHERE id = p_ad_id
    AND author_id = auth.uid()
    AND module = p_module;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_ad_criar_completo(
  text, text, text, text, jsonb, text, integer, text, numeric, text, bigint, bigint, bigint, bigint
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.marketplace_ad_editar_completo(
  integer, text, text, text, text, jsonb, text, integer, text, numeric, text
) TO authenticated;

COMMIT;
