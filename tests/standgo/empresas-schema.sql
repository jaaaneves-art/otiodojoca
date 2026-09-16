-- Fixture mínimo: executar exclusivamente numa base descartável.
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.profiles(id uuid PRIMARY KEY, is_stand_automovel boolean);
CREATE TABLE public.entidades(id bigint PRIMARY KEY, estado text);
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY entidades_public_read ON public.entidades FOR SELECT USING (estado = 'publicado');
GRANT SELECT ON public.entidades TO anon, authenticated;
CREATE TABLE public.marketplace_ads(id bigint PRIMARY KEY, module text, status text, author_id uuid);
INSERT INTO public.marketplace_ads VALUES (1, 'viaturas', 'active', NULL);
\ir ../../supabase/migrations/20260915190000_entidades_empresas_transversal_v1.sql
\ir ../../supabase/migrations/20260915193000_standgo_empresas_v1.sql
INSERT INTO public.entidades VALUES (1,'publicado'),(2,'rascunho');
INSERT INTO public.entidade_empresas(entidade_id) VALUES (1),(2);
INSERT INTO public.standgo_empresas(entidade_id) VALUES (1),(2);
INSERT INTO public.standgo_empresa_atividades(entidade_id, atividade_id)
SELECT e, a.id FROM generate_series(1,2) e CROSS JOIN public.standgo_atividades a
WHERE codigo IN ('calibragem-de-pneus','equilibragem-de-rodas','alinhamento-de-direcao');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.standgo_empresa_atividades) <> 6 THEN RAISE EXCEPTION 'N:N'; END IF;
 IF NOT EXISTS(SELECT FROM public.marketplace_ads WHERE id=1 AND entidade_id IS NULL) THEN RAISE EXCEPTION 'Legacy'; END IF;
 BEGIN
  INSERT INTO public.marketplace_ads VALUES (2,'viaturas','active',NULL,1);
  RAISE EXCEPTION 'Associação indevida aceite';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.standgo_empresa_atividades SELECT * FROM public.standgo_empresa_atividades LIMIT 1;
  RAISE EXCEPTION 'Duplicado aceite';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
END $$;
SET ROLE anon;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.standgo_empresas) <> 1 THEN RAISE EXCEPTION 'RLS empresas'; END IF;
 IF (SELECT count(*) FROM public.standgo_empresa_atividades) <> 3 THEN RAISE EXCEPTION 'RLS atividades'; END IF;
 IF (SELECT count(*) FROM public.standgo_atividades) <> 170 THEN RAISE EXCEPTION 'Catálogo'; END IF;
END $$;
RESET ROLE;
INSERT INTO public.profiles VALUES ('00000000-0000-0000-0000-000000000001',true);
INSERT INTO public.entidade_responsaveis(entidade_id,profile_id) VALUES (1,'00000000-0000-0000-0000-000000000001');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
INSERT INTO public.marketplace_ads VALUES (3,'viaturas','active',NULL,1);
SELECT 'StandGo: catálogo, N:N, RLS, legacy e autorização OK' AS resultado;
