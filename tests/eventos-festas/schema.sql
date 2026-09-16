-- Executar só numa base descartável pelo runner local. Tabelas centrais reais.
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text DEFAULT 'user', is_stand_automovel boolean DEFAULT false);
CREATE SEQUENCE public.freguesias_id_seq;
\ir ../../supabase/schemas/public/tables/categorias_entidade.sql
\ir ../../supabase/schemas/public/tables/freguesias.sql
\ir ../../supabase/schemas/public/tables/localizacoes.sql
\ir ../../supabase/schemas/public/tables/entidades.sql
CREATE TABLE public.marketplace_ads(id bigint PRIMARY KEY, module text, status text, author_id uuid);
CREATE TABLE public.entidade_pedidos(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, entidade_id bigint REFERENCES public.entidades(id), profile_id uuid REFERENCES public.profiles(id), nome_entidade text, tipo_entidade text DEFAULT 'outro', codigo_atividade text, mensagem text, estado text DEFAULT 'pendente', resolvido_por uuid, resolvido_em timestamptz);
ALTER TABLE public.entidade_pedidos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.restaurantes(id bigint PRIMARY KEY, entity_id bigint UNIQUE REFERENCES public.entidades(id));
CREATE TABLE public.alojamentos(id bigint PRIMARY KEY, entity_id bigint UNIQUE REFERENCES public.entidades(id));
CREATE TABLE public.eventos(id bigint PRIMARY KEY, nome text);
INSERT INTO public.eventos VALUES(1,'Agenda preservada');
\ir ../../supabase/migrations/20260915190000_entidades_empresas_transversal_v1.sql
\ir ../../supabase/migrations/20260915193000_standgo_empresas_v1.sql
\ir ../../supabase/migrations/20260915200000_entidades_diaspora_privacidade_v1.sql
\ir ../../supabase/migrations/20260915203000_eventos_festas_profissionais_v1.sql

CREATE FUNCTION public.test_assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; END $$;
INSERT INTO public.profiles(id,role) VALUES
 ('00000000-0000-0000-0000-000000000001','user'),
 ('00000000-0000-0000-0000-000000000002','user'),
 ('00000000-0000-0000-0000-000000000003','admin'),
 ('00000000-0000-0000-0000-000000000004','user');
INSERT INTO public.freguesias(id,cod_ine,nome,municipio) VALUES(1,'010101','Freguesia teste','Concelho teste');
INSERT INTO public.entidades(nome,slug,categoria_id,freguesia_id,estado,localidade) VALUES
 ('Restaurante Teste','restaurante-teste',1,1,'publicado','Lisboa'),
 ('Hotel Teste','hotel-teste',1,1,'publicado','Lisboa'),
 ('Empresa privada','empresa-privada',1,1,'rascunho','Lisboa');
INSERT INTO public.restaurantes VALUES(10,1);
INSERT INTO public.alojamentos VALUES(10,2);
INSERT INTO public.entidade_responsaveis(entidade_id,profile_id,papel,principal) VALUES
 (1,'00000000-0000-0000-0000-000000000001','proprietario',true),
 (2,'00000000-0000-0000-0000-000000000001','gestor',true),
 (3,'00000000-0000-0000-0000-000000000001','administrador',true),
 (1,'00000000-0000-0000-0000-000000000004','colaborador',false);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
SELECT public.test_assert(jsonb_array_length(public.eventos_festas_minhas_empresas())=3,'gestor vê várias entidades existentes');
SELECT public.eventos_festas_guardar(1,'{"nome":"Restaurante Teste","pais_codigo":"PT","localidade":"Lisboa","freguesia_id":1,"capacidade":200,"descricao":"Catering, som e iluminação para casamentos","email":"publico@example.test","fotografias":[],"redes_sociais":{}}',ARRAY['catering','fotografia-de-casamento','iluminacao','aluguer-de-som'],ARRAY['casamento-civil','evento-empresarial']);
SELECT public.eventos_festas_guardar(2,'{"nome":"Hotel Teste","pais_codigo":"PT","localidade":"Lisboa","freguesia_id":1}',ARRAY['hoteis','alojamento-de-convidados'],ARRAY['casamentos','conferencia']);
SELECT public.eventos_festas_guardar(3,'{"nome":"Empresa privada","pais_codigo":"PT","localidade":"Lisboa","freguesia_id":1}',ARRAY['dj'],ARRAY['casamentos'],false);
DO $$ BEGIN
 BEGIN
  PERFORM public.eventos_festas_guardar(1,'{"nome":"Inválida","pais_codigo":"PT","localidade":"Lisboa"}',ARRAY['nao-existe'],ARRAY['casamentos']);
  RAISE EXCEPTION 'Serviço inválido aceite';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.eventos_festas_guardar(1,'{"nome":"Inválida","pais_codigo":"PT","localidade":"Lisboa","website":"javascript:alert(1)"}',ARRAY['dj'],ARRAY['casamentos']);
  RAISE EXCEPTION 'URL perigoso aceite';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
SELECT public.test_assert((SELECT count(*) FROM public.entidades)=3,'adesão não duplica restaurante/alojamento');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_empresa_servicos WHERE entidade_id=1)=4,'vários serviços');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_empresa_tipos WHERE entidade_id=1)=2,'vários tipos');
INSERT INTO public.standgo_empresas(entidade_id) VALUES(1);
SELECT public.test_assert(EXISTS(SELECT 1 FROM public.standgo_empresas s JOIN public.eventos_festas_empresas e USING(entidade_id) WHERE entidade_id=1),'mesma entidade nos dois módulos');
SELECT public.test_assert((SELECT entity_id FROM public.restaurantes WHERE id=10)=1 AND (SELECT entity_id FROM public.alojamentos WHERE id=10)=2,'ligações verticais preservadas');
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_diretorio)=0,'presenças pendentes não são públicas');
DO $$ BEGIN
 BEGIN PERFORM identificacao_fiscal FROM public.entidade_empresas; RAISE EXCEPTION 'NIF exposto'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM public.entidade_responsaveis; RAISE EXCEPTION 'Responsáveis expostos'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.eventos_festas_guardar(NULL,'{}',ARRAY['dj'],ARRAY['casamentos']); RAISE EXCEPTION 'Escrita anónima'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
SELECT public.test_assert(jsonb_array_length(public.eventos_festas_minhas_empresas())=0,'terceiro não obtém perfis de gestão');
DO $$ BEGIN
 BEGIN PERFORM public.eventos_festas_guardar(1,'{"nome":"Ataque","localidade":"Lisboa","pais_codigo":"PT"}',ARRAY['dj'],ARRAY['casamentos']); RAISE EXCEPTION 'Terceiro alterou entidade'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.eventos_festas_empresas SET estado='ativo' WHERE entidade_id=1; RAISE EXCEPTION 'Escrita direta'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.eventos_festas_moderar(1,'ativo'); RAISE EXCEPTION 'Publicação sem admin'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.eventos_festas_pedir_acesso('restaurante-teste','Represento a empresa e peço validação.');
SELECT public.eventos_festas_pedir_acesso('restaurante-teste','Repetição do mesmo pedido.');
SELECT public.test_assert(jsonb_array_length(public.eventos_festas_minhas_empresas())=0,'pedido não concede acesso');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
SELECT public.test_assert(NOT public.eventos_festas_pode_gerir(1),'colaborador sem poder de editar identidade');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT public.eventos_festas_moderar(1,'ativo');
SELECT public.eventos_festas_moderar(2,'ativo');
SELECT public.eventos_festas_resolver_acesso(1,true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
SELECT public.test_assert(public.eventos_festas_pode_gerir(1),'pedido aprovado concede responsabilidade transversal');
SELECT public.eventos_festas_guardar(NULL,'{"nome":"Festas Lusas","pais_codigo":"LU","regiao":"Luxemburgo","localidade":"Luxemburgo","capacidade":250,"email":"festa@example.test"}',ARRAY['wedding-planner','transporte-de-convidados'],ARRAY['casamentos']);
DO $$ BEGIN
 BEGIN PERFORM public.eventos_festas_guardar(NULL,'{"nome":"Festas Lusas","pais_codigo":"LU","regiao":"Luxemburgo","localidade":"Luxemburgo"}',ARRAY['dj'],ARRAY['casamentos']); RAISE EXCEPTION 'Duplicação aceite'; EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
RESET ROLE;
SELECT public.test_assert((SELECT count(*) FROM public.entidade_pedidos)=1,'pedido idempotente');
SELECT public.test_assert(EXISTS(SELECT 1 FROM public.entidades e JOIN public.entidade_empresas ee ON ee.entidade_id=e.id WHERE ee.pais_codigo='LU' AND e.freguesia_id IS NULL AND e.localidade='Luxemburgo'),'empresa na Diáspora sem freguesia fictícia');
SELECT public.test_assert((SELECT count(*) FROM public.eventos WHERE nome='Agenda preservada')=1,'eventos concretos intactos');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT public.eventos_festas_moderar(4,'ativo');
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_pesquisar(p_servico=>'catering',p_tipo=>'casamentos',p_local=>'Lisboa',p_capacidade=>200))=1,'pesquisa serviço + grupo de tipo + localização + capacidade');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_pesquisar(p_servico=>'catering',p_capacidade=>201))=0,'capacidade mínima');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_pesquisar(p_pais=>'LU',p_tipo=>'casamentos'))=1,'pesquisa internacional');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_pesquisar(p_texto=>'som iluminação'))=1,'pesquisa textual');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_pesquisar(p_categoria=>'catering'))=1,'pesquisa categoria profissional');
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_empresas)=3,'RLS mostra apenas publicadas e ativas');
SELECT public.test_assert(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='eventos_festas_diretorio' AND column_name IN ('profile_id','criado_por','identificacao_fiscal','nome_legal','entidade_id')),'contrato público sem dados internos');
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
SELECT public.eventos_festas_moderar(1,'suspenso');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ BEGIN
 BEGIN PERFORM public.eventos_festas_guardar(1,'{"nome":"Restaurante Teste","localidade":"Lisboa","pais_codigo":"PT"}',ARRAY['dj'],ARRAY['casamentos']); RAISE EXCEPTION 'Contorno de suspensão'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT public.test_assert((SELECT count(*) FROM public.eventos_festas_diretorio WHERE slug='restaurante-teste')=0,'suspenso desaparece do diretório');
SELECT 'Eventos & Festas: testes SQL concluídos' AS resultado;
