SET ROLE authenticated;
SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $$ BEGIN
 BEGIN
  INSERT INTO marketplace_ads(author_id,module) VALUES(auth.uid(),'lup');
  RAISE EXCEPTION 'FAIL: direct insert succeeded';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS direct INSERT blocked'; END;
END $$;
SELECT * FROM lup_ad_guardar('{"title":"Oferta","description":"Teste","type":"oferta","category_id":1,"location":"Braga","contact_method":"message","details":{"quantity":"2","unit":"kg","pickup_ends_at":"2027-01-01T12:00:00Z"}}','22222222-2222-4222-8222-222222222222');
SELECT * FROM lup_ad_guardar('{"title":"Oferta","description":"Teste","type":"oferta","category_id":1,"location":"Braga","contact_method":"message","details":{"quantity":"2","unit":"kg","pickup_ends_at":"2027-01-01T12:00:00Z"}}','22222222-2222-4222-8222-222222222222');
SELECT * FROM lup_ad_guardar('{"title":"Venda","description":"Editada","type":"venda","category_id":1,"location":"Porto","contact_method":"phone","price":3.5,"details":{"quantity":"2","unit":"kg","pickup_ends_at":"2027-01-01T12:00:00Z"}}','22222222-2222-4222-8222-222222222222',1);
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM marketplace_ads) <> 1 THEN RAISE EXCEPTION 'FAIL duplicate'; END IF;
 IF NOT EXISTS(SELECT 1 FROM marketplace_ads WHERE id=1 AND module='lup' AND price=3.5 AND price_type='fixed' AND contact_method='phone' AND title='Venda' AND status='active') THEN RAISE EXCEPTION 'FAIL fields'; END IF;
 RAISE NOTICE 'PASS one row; owner edit preserves fields';
END $$;
SET ROLE authenticated;
SET request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
DO $$ BEGIN
 BEGIN PERFORM lup_ad_guardar('{}','22222222-2222-4222-8222-222222222222',1); RAISE EXCEPTION 'FAIL owner';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS other owner blocked'; END;
END $$;
SET request.jwt.claim.sub='';
DO $$ BEGIN
 BEGIN PERFORM lup_ad_guardar('{}','22222222-2222-4222-8222-222222222222'); RAISE EXCEPTION 'FAIL auth';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS no session blocked'; END;
END $$;
SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SET test.minor='true';
DO $$ BEGIN
 BEGIN PERFORM lup_ad_guardar('{}','22222222-2222-4222-8222-222222222222'); RAISE EXCEPTION 'FAIL minor';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS minor blocked'; END;
END $$;
RESET ROLE;
-- Repeatable expected failures: assert the exact error instead of accepting any exception.
SET ROLE authenticated;
SET request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SET test.minor='false';
DO $$
DECLARE payload jsonb := '{"title":"Procura","description":"Teste","type":"procura","category_id":1,"location":"Braga","contact_method":"email","details":{}}';
BEGIN
 BEGIN
  PERFORM lup_ad_guardar(payload || '{"category_id":2}'::jsonb,'44444444-4444-4444-8444-444444444444');
  RAISE EXCEPTION 'FAIL: foreign category accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Categoria LUP inválida' THEN RAISE; END IF; END;
 BEGIN
  PERFORM lup_ad_guardar(payload || '{"title":""}'::jsonb,'44444444-4444-4444-8444-444444444444');
  RAISE EXCEPTION 'FAIL: empty title accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Preencha os campos obrigatórios do anúncio' THEN RAISE; END IF; END;
 BEGIN
  PERFORM lup_ad_guardar(payload,NULL);
  RAISE EXCEPTION 'FAIL: missing key accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Pedido inválido' THEN RAISE; END IF; END;
 -- Changing from sale to demand must clear the price and collection details.
 PERFORM lup_ad_guardar(payload,'44444444-4444-4444-8444-444444444444',1);
 RAISE NOTICE 'PASS invalid category, empty title, missing key rejected; sale-to-demand executed';
END $$;
RESET ROLE;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM marketplace_ads WHERE id=1 AND type='procura' AND price IS NULL AND price_type IS NULL AND details='{}'::jsonb) THEN RAISE EXCEPTION 'FAIL clearing sale fields'; END IF;
END $$;
INSERT INTO marketplace_ads(author_id,module,title) VALUES('11111111-1111-4111-8111-111111111111','gran-bazar','Other module');
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN
  PERFORM lup_ad_guardar('{}','44444444-4444-4444-8444-444444444444',2);
  RAISE EXCEPTION 'FAIL cross-module edit';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS same owner cannot edit another module'; END;
 BEGIN
  UPDATE marketplace_ads SET title='bypass'; RAISE EXCEPTION 'FAIL direct update';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS direct UPDATE blocked'; END;
 BEGIN
  DELETE FROM marketplace_ads; RAISE EXCEPTION 'FAIL direct delete';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS direct DELETE blocked'; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('anon','public.lup_ad_guardar(jsonb,uuid,integer)','EXECUTE') THEN RAISE EXCEPTION 'FAIL anonymous execute'; END IF;
 RAISE NOTICE 'PASS no anonymous EXECUTE grant';
END $$;
