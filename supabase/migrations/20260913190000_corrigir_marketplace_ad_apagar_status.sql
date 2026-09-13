-- Corrige um bug pré-existente em marketplace_ad_apagar() (criada esta
-- manhã em 20260913020000): tentava gravar status='deleted', valor que
-- não existe em marketplace_ads_status_check (só permite draft/active/
-- reserved/sold/traded/given/expired/cancelled/inactive). Ou seja, a
-- função nunca tinha funcionado desde que foi criada -- toda a chamada
-- falharia com "violates check constraint".
--
-- Descoberto ao testar de ponta a ponta antes de ligar
-- lib/marketplace/{retailing,beleza,mediacao,consultorio}-actions.ts a
-- esta RPC (ver migration 20260913180000_fechar_bypass_marketplace_ads).
-- Testado em transação com ROLLBACK, sem tocar em dados reais: editar +
-- apagar confirmados a funcionar depois desta correção.

BEGIN;

CREATE OR REPLACE FUNCTION public.marketplace_ad_apagar(p_ad_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.marketplace_ads
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_ad_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

COMMIT;
