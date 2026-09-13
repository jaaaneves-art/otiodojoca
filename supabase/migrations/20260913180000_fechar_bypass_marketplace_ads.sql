-- Fecha o último bypass do "RPC-only writes" (ver
-- docs/planos/20260913T0945-plano-sessao.md, secção "P0 NOVO"). Só foi
-- possível agora porque marketplace_ad_editar() foi alargada
-- (20260913170000) e os 4 ficheiros que ainda faziam UPDATE/DELETE
-- direto (lib/marketplace/{retailing,beleza,mediacao,consultorio}-actions.ts)
-- foram migrados para chamarem marketplace_ad_editar()/marketplace_ad_apagar().
--
-- IMPORTANTE, descoberto ao preparar esta migration: só apagar as 2
-- policies antigas NÃO chegava. A policy "marketplace_ads_minors_check"
-- (INSERT) dá sempre with_check=true para não-menores e NÃO verifica
-- author_id — ou seja, ficaria como única policy de INSERT permissiva,
-- reabrindo exatamente a falsificação de autoria que a migration
-- 20260911150000_correcao_p0_p1_autoria_e_leiloes tinha fechado há 2
-- dias. A única forma robusta de fechar isto de vez (e não depender de
-- nenhuma policy futura ficar "esquecida" outra vez) é tirar mesmo o
-- GRANT de escrita direta a "authenticated" nesta tabela -- tal como já
-- acontece em social_posts/social_post_comments/social_post_reactions,
-- que só têm GRANT de SELECT. As RPC (marketplace_ad_criar/_editar/
-- _apagar) continuam a funcionar porque são SECURITY DEFINER,
-- pertencem a "postgres" e por isso não passam pelo GRANT nem pela RLS
-- do chamador.
--
-- De caminho, revoga também TRUNCATE -- TRUNCATE não é filtrado pela
-- RLS de forma nenhuma (nem por policy nenhuma), por isso um GRANT
-- TRUNCATE a "authenticated" deixaria qualquer utilizador autenticado
-- esvaziar a tabela inteira. Não investiguei se outras tabelas têm o
-- mesmo GRANT TRUNCATE indevido -- fica registado como algo a
-- verificar depois, à parte.

BEGIN;

DROP POLICY IF EXISTS "Autores gerem os seus anuncios" ON public.marketplace_ads;
DROP POLICY IF EXISTS "Utilizadores autenticados criam anuncios" ON public.marketplace_ads;

-- Sem a policy ALL "Autores gerem os seus anuncios", os autores
-- deixavam de conseguir ver os seus próprios anúncios não-ativos
-- (rascunho/expirado/apagado) -- só ficaria "Anuncios ativos visiveis
-- para todos" (status='active'). Repõe isso como SELECT-only.
CREATE POLICY "Autores veem os seus anuncios" ON public.marketplace_ads
  FOR SELECT
  USING (auth.uid() = author_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.marketplace_ads FROM authenticated;

-- marketplace_ads_insert/_update/_delete (false) e
-- marketplace_ads_minors_check ficam na tabela (inofensivas agora que
-- o GRANT foi retirado) -- tudo passa a ser mesmo só via
-- marketplace_ad_criar/_editar/_apagar.

COMMIT;
