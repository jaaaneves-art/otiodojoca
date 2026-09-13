BEGIN;

-- ============================================================
-- Alarga job_criar com os campos que o formulário real recolhe
-- (nivel_formacao_minimo, municipio_id, escolha de estado
-- rascunho/publicada) e corrige salario_fonte para 'empresa'
-- (a versão original tinha 'fornecido' fixo, que não é o que o
-- código usa). Acrescenta também a verificação de
-- empregos_empresas.estado = 'aprovado', que a Server Action já
-- fazia antes de inserir, para a RPC ficar auto-suficiente.
-- ============================================================

DROP FUNCTION IF EXISTS public.job_criar(bigint, text, text, text, text, text, text, numeric, numeric);

CREATE FUNCTION public.job_criar(
  p_empresa_id bigint,
  p_titulo text,
  p_descricao text,
  p_categoria text,
  p_modalidade text,
  p_tipo_contrato text,
  p_nivel_experiencia text,
  p_municipio_id integer,
  p_nivel_formacao_minimo text DEFAULT NULL,
  p_salario_min numeric DEFAULT NULL,
  p_salario_max numeric DEFAULT NULL,
  p_estado text DEFAULT 'rascunho'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job_id bigint;
BEGIN
  IF p_estado NOT IN ('rascunho', 'publicada') THEN
    RAISE EXCEPTION 'Estado inicial inválido: %', p_estado;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.empregos_empresas
    WHERE id = p_empresa_id AND profile_id = auth.uid() AND estado = 'aprovado'
  ) THEN
    RAISE EXCEPTION 'Não tem permissão para criar vagas nesta empresa';
  END IF;

  INSERT INTO public.jobs (
    empresa_id, titulo, descricao, categoria, modalidade,
    tipo_contrato, nivel_experiencia, nivel_formacao_minimo, municipio_id,
    salario_min, salario_max, salario_fonte, estado, data_publicacao
  )
  VALUES (
    p_empresa_id, p_titulo, p_descricao, p_categoria, p_modalidade,
    p_tipo_contrato, p_nivel_experiencia, p_nivel_formacao_minimo, p_municipio_id,
    p_salario_min, p_salario_max, 'empresa', p_estado,
    CASE WHEN p_estado = 'publicada' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_criar(bigint, text, text, text, text, text, text, integer, text, numeric, numeric, text) TO authenticated;

-- ============================================================
-- job_fechar: acrescenta a guarda de estado que a UPDATE direta
-- antiga tinha (.in('estado', ['publicada','pausada'])) — a
-- versão original da RPC fechava a partir de qualquer estado.
-- ============================================================

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
  WHERE id = p_job_id AND estado IN ('publicada', 'pausada');

  RETURN FOUND;
END;
$$;

-- ============================================================
-- Novas RPC: publicar / pausar / reabrir — substituem o
-- .from('jobs').update(...) direto de
-- app/empregos/empresa/vagas/actions.ts (bloqueado pela policy
-- jobs_update ... USING (false) desde 20260913040000).
-- ============================================================

CREATE FUNCTION public.job_publicar(p_job_id bigint)
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
    RAISE EXCEPTION 'Não tem permissão para publicar esta vaga';
  END IF;

  UPDATE public.jobs
  SET estado = 'publicada', data_publicacao = now(), updated_at = now()
  WHERE id = p_job_id AND estado IN ('rascunho', 'pausada');

  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.job_pausar(p_job_id bigint)
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
    RAISE EXCEPTION 'Não tem permissão para pausar esta vaga';
  END IF;

  UPDATE public.jobs
  SET estado = 'pausada', updated_at = now()
  WHERE id = p_job_id AND estado = 'publicada';

  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.job_reabrir(p_job_id bigint)
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
    RAISE EXCEPTION 'Não tem permissão para reabrir esta vaga';
  END IF;

  UPDATE public.jobs
  SET estado = 'pausada', updated_at = now()
  WHERE id = p_job_id AND estado = 'fechada';

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.job_publicar(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_pausar(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_reabrir(bigint) TO authenticated;

COMMIT;
