-- Aditiva; preserva freguesias portuguesas e a identidade empresarial transversal.
BEGIN;
ALTER TABLE public.entidades ALTER COLUMN freguesia_id DROP NOT NULL;
ALTER TABLE public.entidades
  ADD COLUMN IF NOT EXISTS regiao text,
  ADD COLUMN IF NOT EXISTS localidade text;
CREATE INDEX IF NOT EXISTS entidades_regiao_localidade_idx
  ON public.entidades (lower(regiao), lower(localidade));
COMMENT ON COLUMN public.entidades.freguesia_id IS
'Freguesia portuguesa, quando aplicável. Entidades na Diáspora podem usar região/localidade e entidade_empresas.pais_codigo sem freguesia fictícia.';

-- Identificação fiscal e nome legal não pertencem ao contrato público.
REVOKE SELECT ON public.entidade_empresas FROM anon, authenticated;
GRANT SELECT (entidade_id, pais_codigo, tipo_organizacao, verificada)
  ON public.entidade_empresas TO anon, authenticated;
-- A função é usada em políticas públicas, mas só responde para auth.uid().
REVOKE ALL ON FUNCTION public.e_responsavel_entidade(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.e_responsavel_entidade(bigint) TO anon, authenticated;
COMMIT;
