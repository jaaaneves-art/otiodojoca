-- ============================================================
-- SECURITY TESTS: Validar que policies bloqueiam INSERT direto
-- ============================================================

BEGIN;

-- Test 1: social_posts — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.social_posts (author_id, content, visibility)
  VALUES (auth.uid(), 'test', 'public');
  RAISE EXCEPTION 'FAIL: social_posts INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: social_posts INSERT bloqueado ✓';
END $$;

-- Test 2: social_post_comments — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.social_post_comments (post_id, author_id, content)
  VALUES ('00000000-0000-0000-0000-000000000000'::uuid, auth.uid(), 'test');
  RAISE EXCEPTION 'FAIL: social_post_comments INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: social_post_comments INSERT bloqueado ✓';
END $$;

-- Test 3: social_post_reactions — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.social_post_reactions (post_id, user_id, reaction)
  VALUES ('00000000-0000-0000-0000-000000000000'::uuid, auth.uid(), 'like');
  RAISE EXCEPTION 'FAIL: social_post_reactions INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: social_post_reactions INSERT bloqueado ✓';
END $$;

-- Test 4: marketplace_ads — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.marketplace_ads (author_id, title, type, details)
  VALUES (auth.uid(), 'test', 'test', '{}'::jsonb);
  RAISE EXCEPTION 'FAIL: marketplace_ads INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: marketplace_ads INSERT bloqueado ✓';
END $$;

-- Test 5: restaurante_reservas — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.restaurante_reservas (restaurante_id, nome_cliente, email_cliente)
  VALUES (1, 'test', 'test@test.com');
  RAISE EXCEPTION 'FAIL: restaurante_reservas INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: restaurante_reservas INSERT bloqueado ✓';
END $$;

-- Test 6: reservas_alojamento — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.reservas_alojamento (alojamento_id, nome_hospede, email_hospede, data_entrada, data_saida, num_pessoas, tipo_refeicao, preco_total, status)
  VALUES (1, 'test', 'test@test.com', now()::date, (now() + '1 day'::interval)::date, 2, 'meia pensao', 100, 'pendente');
  RAISE EXCEPTION 'FAIL: reservas_alojamento INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: reservas_alojamento INSERT bloqueado ✓';
END $$;

-- Test 7: jobs — INSERT bloqueado
DO $$
BEGIN
  INSERT INTO public.jobs (empresa_id, titulo, descricao, modalidade, salario_fonte, estado)
  VALUES (1, 'test', 'test', 'remoto', 'fornecido', 'aberta');
  RAISE EXCEPTION 'FAIL: jobs INSERT deveria estar bloqueado!';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'PASS: jobs INSERT bloqueado ✓';
END $$;

-- Test 8: e_admin() function existe
DO $$
DECLARE
  v_result boolean;
BEGIN
  SELECT public.e_admin() INTO v_result;
  RAISE NOTICE 'PASS: e_admin() function OK (result: %) ✓', v_result;
END $$;

-- Test 9: e_menor_agora() function existe
DO $$
DECLARE
  v_result boolean;
BEGIN
  SELECT public.e_menor_agora() INTO v_result;
  RAISE NOTICE 'PASS: e_menor_agora() function OK (result: %) ✓', v_result;
END $$;

-- Test 10: pode_publicar_fora_grupo() function existe
DO $$
DECLARE
  v_result boolean;
BEGIN
  SELECT public.pode_publicar_fora_grupo() INTO v_result;
  RAISE NOTICE 'PASS: pode_publicar_fora_grupo() function OK (result: %) ✓', v_result;
END $$;

ROLLBACK;
