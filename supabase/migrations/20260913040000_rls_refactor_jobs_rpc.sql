-- ============================================================
-- RLS REFACTOR: jobs (empregos) — 3 RPC
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.job_criar(
  p_empresa_id bigint,
  p_titulo text,
  p_descricao text,
  p_categoria text,
  p_modalidade text,
  p_tipo_contrato text,
  p_nivel_experiencia text,
  p_salario_min numeric DEFAULT NULL,
  p_salario_max numeric DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.empregos_empresas
    WHERE id = p_empresa_id AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não tem permissão para criar vagas nesta empresa';
  END IF;

  INSERT INTO public.jobs (
    empresa_id, titulo, descricao, categoria, modalidade,
    tipo_contrato, nivel_experiencia, salario_min, salario_max,
    salario_fonte, estado
  )
  VALUES (
    p_empresa_id, p_titulo, p_descricao, p_categoria, p_modalidade,
    p_tipo_contrato, p_nivel_experiencia, p_salario_min, p_salario_max,
    'fornecido', 'aberta'
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.job_editar(
  p_job_id bigint,
  p_titulo text,
  p_descricao text,
  p_salario_min numeric DEFAULT NULL,
  p_salario_max numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.empregos_empresas ee ON ee.id = j.empresa_id
    WHERE j.id = p_job_id AND ee.profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não tem permissão para editar esta vaga';
  END IF;

  UPDATE public.jobs
  SET titulo = p_titulo, descricao = p_descricao,
      salario_min = p_salario_min, salario_max = p_salario_max,
      updated_at = now()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.job_fechar(p_job_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.empregos_empresas ee ON ee.id = j.empresa_id
    WHERE j.id = p_job_id AND ee.profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não tem permissão para fechar esta vaga';
  END IF;

  UPDATE public.jobs
  SET estado = 'fechada', data_fecho = now(), updated_at = now()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- POLICIES — RPC ONLY
-- ============================================================

DROP POLICY IF EXISTS jobs_insert ON public.jobs;
CREATE POLICY jobs_insert ON public.jobs FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS jobs_update ON public.jobs;
CREATE POLICY jobs_update ON public.jobs FOR UPDATE USING (false);

DROP POLICY IF EXISTS jobs_delete ON public.jobs;
CREATE POLICY jobs_delete ON public.jobs FOR DELETE USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.job_criar(bigint, text, text, text, text, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_editar(bigint, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_fechar(bigint) TO authenticated;

COMMIT;
