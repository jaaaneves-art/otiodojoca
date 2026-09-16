-- OTJ / StandGo — Empresas Automóvel V1
-- Depende de:
-- 20260915190000_entidades_empresas_transversal_v1.sql
--
-- NÃO elimina profiles.is_stand_automovel.
-- A coluna antiga mantém-se temporariamente para compatibilidade.

BEGIN;

CREATE TABLE IF NOT EXISTS public.standgo_empresas (
  entidade_id bigint PRIMARY KEY
    REFERENCES public.entidade_empresas(entidade_id) ON DELETE CASCADE,

  estado text NOT NULL DEFAULT 'ativo',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT standgo_empresas_estado_check
    CHECK (estado IN ('rascunho','ativo','suspenso'))
);

CREATE INDEX IF NOT EXISTS standgo_empresas_estado_idx
  ON public.standgo_empresas(estado);

-- Catálogo vertical: não substitui os CAE/descrições de entidade_atividades.
-- Grupos e sinónimos são dados editáveis, sem enums nem migrations estruturais.
CREATE TABLE public.standgo_atividades (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE CHECK (codigo ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text NOT NULL CHECK (btrim(nome) <> ''),
  grupos text[] NOT NULL DEFAULT '{}',
  sinonimos text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.standgo_empresa_atividades (
  entidade_id bigint NOT NULL REFERENCES public.standgo_empresas(entidade_id) ON DELETE CASCADE,
  atividade_id bigint NOT NULL REFERENCES public.standgo_atividades(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entidade_id, atividade_id)
);
CREATE INDEX standgo_empresa_atividades_pesquisa_idx
  ON public.standgo_empresa_atividades(atividade_id, entidade_id);

INSERT INTO public.standgo_atividades(codigo, nome, grupos, sinonimos) VALUES
  ('compra-e-venda-de-automoveis', 'Compra e venda de automóveis', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('stand-automovel', 'Stand automóvel', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('concessionario', 'Concessionário', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('compra-de-viaturas', 'Compra de viaturas', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('venda-de-viaturas', 'Venda de viaturas', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('importacao-automovel', 'Importação automóvel', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('exportacao-automovel', 'Exportação automóvel', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('intermediacao-automovel', 'Intermediação automóvel', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('veiculos-usados', 'Veículos usados', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('veiculos-novos', 'Veículos novos', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('veiculos-classicos', 'Veículos clássicos', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('veiculos-comerciais', 'Veículos comerciais', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('motas', 'Motas', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('maquinas-e-veiculos-especiais', 'Máquinas e veículos especiais', ARRAY['comercio']::text[], ARRAY[]::text[]),
  ('rent-a-car', 'Rent-a-Car', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('aluguer-sem-motorista', 'Aluguer sem motorista', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('aluguer-com-motorista', 'Aluguer com motorista', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transferes', 'Transferes', ARRAY['aluguer-transporte']::text[], ARRAY['transfers']::text[]),
  ('transporte-executivo', 'Transporte executivo', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transporte-para-casamentos', 'Transporte para casamentos', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transporte-para-cerimonias', 'Transporte para cerimónias', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transporte-para-eventos', 'Transporte para eventos', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('limusinas', 'Limusinas', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('automoveis-classicos-para-cerimonias', 'Automóveis clássicos para cerimónias', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('carrinhas', 'Carrinhas', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('minibus', 'Minibus', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transporte-de-passageiros', 'Transporte de passageiros', ARRAY['aluguer-transporte']::text[], ARRAY[]::text[]),
  ('transporte-de-viaturas', 'Transporte de viaturas', ARRAY['aluguer-transporte','assistencia']::text[], ARRAY[]::text[]),
  ('oficina-automovel', 'Oficina automóvel', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('mecanico', 'Mecânico', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('mecanica-geral', 'Mecânica geral', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('mecanica-especializada', 'Mecânica especializada', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('diagnostico-automovel', 'Diagnóstico automóvel', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('diagnostico-eletronico', 'Diagnóstico eletrónico', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('eletricista-automovel', 'Eletricista automóvel', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('eletronica-automovel', 'Eletrónica automóvel', ARRAY['oficinas-mecanica','eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('motores', 'Motores', ARRAY['oficinas-mecanica','pecas']::text[], ARRAY[]::text[]),
  ('caixas-de-velocidades', 'Caixas de velocidades', ARRAY['oficinas-mecanica','pecas']::text[], ARRAY[]::text[]),
  ('embraiagens', 'Embraiagens', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('travoes', 'Travões', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('suspensao', 'Suspensão', ARRAY['oficinas-mecanica','pecas']::text[], ARRAY[]::text[]),
  ('direcao', 'Direção', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('escape', 'Escape', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('ar-condicionado-automovel', 'Ar condicionado automóvel', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('sistemas-de-injecao', 'Sistemas de injeção', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('hibridos', 'Híbridos', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('veiculos-eletricos', 'Veículos elétricos', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('preparacao-para-inspecao', 'Preparação para inspeção', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('manutencao', 'Manutenção', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('revisoes', 'Revisões', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('mudanca-de-oleo', 'Mudança de óleo', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('restauro-automovel', 'Restauro automóvel', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('restauro-de-classicos', 'Restauro de clássicos', ARRAY['oficinas-mecanica']::text[], ARRAY[]::text[]),
  ('bate-chapas', 'Bate-chapas', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('chaparia', 'Chaparia', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('carrocaria', 'Carroçaria', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('pintura-automovel', 'Pintura automóvel', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('reparacao-de-carrocaria', 'Reparação de carroçaria', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('reparacao-de-riscos', 'Reparação de riscos', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('reparacao-de-mossas', 'Reparação de mossas', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('restauro-de-carrocaria', 'Restauro de carroçaria', ARRAY['chapa-pintura']::text[], ARRAY[]::text[]),
  ('vidros-automovel', 'Vidros automóvel', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('reparacao-de-vidros', 'Reparação de vidros', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('substituicao-de-vidros', 'Substituição de vidros', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('para-brisas', 'Para-brisas', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('reparacao-de-para-brisas', 'Reparação de para-brisas', ARRAY['vidros']::text[], ARRAY['reparar para-brisas']::text[]),
  ('substituicao-de-para-brisas', 'Substituição de para-brisas', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('vidros-laterais', 'Vidros laterais', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('vidro-traseiro', 'Vidro traseiro', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('tetos-panoramicos', 'Tetos panorâmicos', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('reparacao-de-impactos', 'Reparação de impactos', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('reparacao-de-pequenas-fissuras', 'Reparação de pequenas fissuras', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('quebra-de-vidros', 'Quebra de vidros', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('substituicao-apos-quebra', 'Substituição após quebra', ARRAY['vidros']::text[], ARRAY[]::text[]),
  ('calibracao-adas-apos-substituicao-de-para-brisas', 'Calibração ADAS após substituição de para-brisas', ARRAY['vidros']::text[], ARRAY['calibração de câmaras','calibração de sensores ADAS']::text[]),
  ('loja-de-pneus', 'Loja de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('centro-de-pneus', 'Centro de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('venda-de-pneus', 'Venda de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('pneus-novos', 'Pneus novos', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('pneus-usados', 'Pneus usados', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('montagem-de-pneus', 'Montagem de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('desmontagem-de-pneus', 'Desmontagem de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('reparacao-de-pneus', 'Reparação de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('furos', 'Furos', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('calibragem-de-pneus', 'Calibragem de pneus', ARRAY['pneus']::text[], ARRAY['calibragem','enchimento de pneus']::text[]),
  ('equilibragem-de-rodas', 'Equilibragem de rodas', ARRAY['pneus']::text[], ARRAY['equilibragem']::text[]),
  ('alinhamento-de-direcao', 'Alinhamento de direção', ARRAY['pneus']::text[], ARRAY['alinhamento']::text[]),
  ('geometria-da-direcao', 'Geometria da direção', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('jantes', 'Jantes', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('venda-de-jantes', 'Venda de jantes', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('reparacao-de-jantes', 'Reparação de jantes', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('troca-sazonal-de-pneus', 'Troca sazonal de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('armazenamento-de-pneus', 'Armazenamento de pneus', ARRAY['pneus']::text[], ARRAY[]::text[]),
  ('loja-de-pecas-automovel', 'Loja de peças automóvel', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-novas', 'Peças novas', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-usadas', 'Peças usadas', ARRAY['pecas','sucatas']::text[], ARRAY[]::text[]),
  ('pecas-recondicionadas', 'Peças recondicionadas', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-originais', 'Peças originais', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-aftermarket', 'Peças aftermarket', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('acessorios-automovel', 'Acessórios automóvel', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('baterias', 'Baterias', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('oleos', 'Óleos', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('lubrificantes', 'Lubrificantes', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('filtros', 'Filtros', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('travagem', 'Travagem', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('material-eletrico', 'Material elétrico', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('iluminacao-automovel', 'Iluminação automóvel', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('componentes-de-carrocaria', 'Componentes de carroçaria', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-para-classicos', 'Peças para clássicos', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('pecas-para-motos', 'Peças para motos', ARRAY['pecas']::text[], ARRAY[]::text[]),
  ('sucata-automovel', 'Sucata automóvel', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('centro-de-abate', 'Centro de abate', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('centro-de-desmantelamento', 'Centro de desmantelamento', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('veiculos-para-pecas', 'Veículos para peças', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('salvados', 'Salvados', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('compra-de-veiculos-para-abate', 'Compra de veículos para abate', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('recolha-de-veiculos', 'Recolha de veículos', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('desmantelamento', 'Desmantelamento', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('recuperacao-de-componentes', 'Recuperação de componentes', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('reciclagem-automovel', 'Reciclagem automóvel', ARRAY['sucatas']::text[], ARRAY[]::text[]),
  ('reboques', 'Reboques', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('pronto-socorro', 'Pronto-socorro', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('assistencia-em-viagem', 'Assistência em viagem', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('desempanagem', 'Desempanagem', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('recuperacao-de-veiculos', 'Recuperação de veículos', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('assistencia-24-horas', 'Assistência 24 horas', ARRAY['assistencia']::text[], ARRAY[]::text[]),
  ('lavagem-automovel', 'Lavagem automóvel', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('lavagem-manual', 'Lavagem manual', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('lavagem-automatica', 'Lavagem automática', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('limpeza-interior', 'Limpeza interior', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('limpeza-profunda', 'Limpeza profunda', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('detalhe-automovel', 'Detalhe automóvel', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('polimento', 'Polimento', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('tratamento-de-pintura', 'Tratamento de pintura', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('protecao-ceramica', 'Proteção cerâmica', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('limpeza-de-estofos', 'Limpeza de estofos', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('higienizacao', 'Higienização', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('restauro-de-farois', 'Restauro de faróis', ARRAY['lavagem-detalhe']::text[], ARRAY[]::text[]),
  ('estofador-automovel', 'Estofador automóvel', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('reparacao-de-bancos', 'Reparação de bancos', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('estofos-em-pele', 'Estofos em pele', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('estofos-em-tecido', 'Estofos em tecido', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('tetos-interiores', 'Tetos interiores', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('volantes', 'Volantes', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('interiores-personalizados', 'Interiores personalizados', ARRAY['estofos-interiores']::text[], ARRAY[]::text[]),
  ('diagnostico', 'Diagnóstico', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('reprogramacao', 'Reprogramação', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('alarmes', 'Alarmes', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('imobilizadores', 'Imobilizadores', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('gps', 'GPS', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('multimedia', 'Multimédia', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('sensores-de-estacionamento', 'Sensores de estacionamento', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('camaras', 'Câmaras', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('som-automovel', 'Som automóvel', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('iluminacao', 'Iluminação', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('acessorios', 'Acessórios', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('instalacao-de-acessorios', 'Instalação de acessórios', ARRAY['eletronica-acessorios']::text[], ARRAY[]::text[]),
  ('peritagem-automovel', 'Peritagem automóvel', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('avaliacao-de-viaturas', 'Avaliação de viaturas', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('inspecao-automovel', 'Inspeção automóvel', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('restauro', 'Restauro', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('classicos', 'Clássicos', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('servicos-para-veiculos-eletricos', 'Serviços para veículos elétricos', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('carregamento-eletrico', 'Carregamento elétrico', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('instalacao-de-carregadores-eletricos', 'Instalação de carregadores elétricos', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('manutencao-de-carregadores-eletricos', 'Manutenção de carregadores elétricos', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('servicos-para-motos', 'Serviços para motos', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('servicos-para-veiculos-comerciais', 'Serviços para veículos comerciais', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('servicos-para-maquinas-e-veiculos-especiais', 'Serviços para máquinas e veículos especiais', ARRAY['outros']::text[], ARRAY[]::text[]),
  ('outros-servicos-automovel', 'Outros serviços automóvel', ARRAY['outros']::text[], ARRAY[]::text[]);

-- Identidade empresarial do anúncio.
-- author_id continua a identificar a pessoa que executou a publicação.
ALTER TABLE public.marketplace_ads
  ADD COLUMN IF NOT EXISTS entidade_id bigint
  REFERENCES public.entidades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS marketplace_ads_entidade_idx
  ON public.marketplace_ads(entidade_id)
  WHERE entidade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_ads_viaturas_entidade_idx
  ON public.marketplace_ads(entidade_id, status)
  WHERE module = 'viaturas' AND entidade_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.pode_publicar_standgo_por_entidade(
  p_entidade_id bigint
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.standgo_empresas se
    JOIN public.entidade_empresas ee
      ON ee.entidade_id = se.entidade_id
    WHERE se.entidade_id = p_entidade_id
      AND se.estado = 'ativo'
      AND public.e_responsavel_entidade(se.entidade_id)
  );
$$;

-- A nova FK não pode permitir atribuir anúncios a empresas de terceiros.
CREATE FUNCTION public.validar_entidade_anuncio_standgo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.entidade_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.entidade_id IS NOT DISTINCT FROM OLD.entidade_id
       AND NEW.module IS NOT DISTINCT FROM OLD.module THEN RETURN NEW; END IF;
  END IF;
  IF NEW.module = 'viaturas'
     AND NOT public.pode_publicar_standgo_por_entidade(NEW.entidade_id) THEN
    RAISE EXCEPTION 'Sem autorização para publicar por esta empresa StandGo'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validar_entidade_anuncio_standgo() FROM PUBLIC;
CREATE TRIGGER marketplace_ads_validar_entidade_standgo
  BEFORE INSERT OR UPDATE OF entidade_id, module ON public.marketplace_ads
  FOR EACH ROW EXECUTE FUNCTION public.validar_entidade_anuncio_standgo();

ALTER TABLE public.standgo_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY standgo_empresas_public_read
ON public.standgo_empresas
FOR SELECT
USING (
  (estado = 'ativo' AND EXISTS (
    SELECT 1 FROM public.entidades e
    WHERE e.id = entidade_id AND e.estado = 'publicado'
  ))
  OR public.e_responsavel_entidade(entidade_id)
);

GRANT SELECT ON public.standgo_empresas
  TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.pode_publicar_standgo_por_entidade(bigint)
TO authenticated;

COMMENT ON TABLE public.standgo_empresas IS
'Presença StandGo da entidade empresarial OTJ; atividades e serviços em standgo_empresa_atividades. A mesma entidade pode participar noutros módulos.';

COMMENT ON COLUMN public.marketplace_ads.entidade_id IS
'Entidade em nome da qual o anúncio foi publicado. NULL significa publicação particular/legada. author_id mantém a autoria humana.';

ALTER TABLE public.standgo_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standgo_empresa_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY standgo_atividades_public_read ON public.standgo_atividades
  FOR SELECT USING (ativo);
CREATE POLICY standgo_empresa_atividades_read ON public.standgo_empresa_atividades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.standgo_empresas se
      JOIN public.entidades e ON e.id = se.entidade_id
      WHERE se.entidade_id = standgo_empresa_atividades.entidade_id
        AND se.estado = 'ativo' AND e.estado = 'publicado')
    OR public.e_responsavel_entidade(entidade_id)
  );
-- Gestão exclusivamente por backend autorizado nesta fase; sem escrita pública.
GRANT SELECT ON public.standgo_atividades, public.standgo_empresa_atividades TO anon, authenticated;
GRANT ALL ON public.standgo_empresas, public.standgo_atividades,
  public.standgo_empresa_atividades TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.standgo_atividades_id_seq TO service_role;
REVOKE ALL ON FUNCTION public.pode_publicar_standgo_por_entidade(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_publicar_standgo_por_entidade(bigint) TO authenticated;

COMMIT;
