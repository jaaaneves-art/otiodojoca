-- OTJ — Empresas transversal V1
-- Entidade é a identidade central.
-- Esta migration acrescenta apenas informação empresarial e responsáveis.
-- NÃO duplica nome, morada, telefone, email, website ou localização.

BEGIN;

CREATE TABLE IF NOT EXISTS public.entidade_empresas (
  entidade_id bigint PRIMARY KEY
    REFERENCES public.entidades(id) ON DELETE CASCADE,

  nome_legal text,
  identificacao_fiscal text,
  pais_codigo text NOT NULL DEFAULT 'PT',

  tipo_organizacao text NOT NULL DEFAULT 'empresa',
  verificada boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT entidade_empresas_tipo_check CHECK (
    tipo_organizacao IN (
      'empresa',
      'empresario_individual',
      'associacao',
      'cooperativa',
      'fundacao',
      'organismo',
      'outro'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS entidade_empresas_fiscal_pais_uq
  ON public.entidade_empresas (
    pais_codigo,
    lower(identificacao_fiscal)
  )
  WHERE identificacao_fiscal IS NOT NULL
    AND trim(identificacao_fiscal) <> '';

CREATE TABLE IF NOT EXISTS public.entidade_atividades (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  entidade_id bigint NOT NULL
    REFERENCES public.entidades(id) ON DELETE CASCADE,

  codigo text,
  descricao text NOT NULL,
  principal boolean NOT NULL DEFAULT false,
  origem text NOT NULL DEFAULT 'manual',

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT entidade_atividades_origem_check
    CHECK (origem IN ('cae', 'manual', 'importado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS entidade_atividade_principal_uq
  ON public.entidade_atividades(entidade_id)
  WHERE principal = true;

CREATE INDEX IF NOT EXISTS entidade_atividades_entidade_idx
  ON public.entidade_atividades(entidade_id);

CREATE TABLE IF NOT EXISTS public.entidade_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  entidade_id bigint NOT NULL
    REFERENCES public.entidades(id) ON DELETE CASCADE,

  profile_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  papel text NOT NULL DEFAULT 'gestor',
  principal boolean NOT NULL DEFAULT false,
  estado text NOT NULL DEFAULT 'ativo',

  criado_por uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(entidade_id, profile_id),

  CONSTRAINT entidade_responsaveis_papel_check
    CHECK (papel IN ('proprietario','administrador','gestor','colaborador')),

  CONSTRAINT entidade_responsaveis_estado_check
    CHECK (estado IN ('pendente','ativo','suspenso','revogado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS entidade_responsavel_principal_uq
  ON public.entidade_responsaveis(entidade_id)
  WHERE principal = true AND estado = 'ativo';

CREATE INDEX IF NOT EXISTS entidade_responsaveis_profile_idx
  ON public.entidade_responsaveis(profile_id);

CREATE OR REPLACE FUNCTION public.e_responsavel_entidade(
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
    FROM public.entidade_responsaveis er
    WHERE er.entidade_id = p_entidade_id
      AND er.profile_id = auth.uid()
      AND er.estado = 'ativo'
  );
$$;

ALTER TABLE public.entidade_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY entidade_empresas_public_read
ON public.entidade_empresas
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.entidades e
    WHERE e.id = entidade_id
      AND e.estado = 'publicado'
  )
  OR public.e_responsavel_entidade(entidade_id)
);

CREATE POLICY entidade_atividades_public_read
ON public.entidade_atividades
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.entidades e
    WHERE e.id = entidade_id
      AND e.estado = 'publicado'
  )
  OR public.e_responsavel_entidade(entidade_id)
);

CREATE POLICY entidade_responsaveis_read
ON public.entidade_responsaveis
FOR SELECT TO authenticated
USING (
  profile_id = auth.uid()
  OR public.e_responsavel_entidade(entidade_id)
);

GRANT SELECT ON public.entidade_empresas
  TO anon, authenticated;

GRANT SELECT ON public.entidade_atividades
  TO anon, authenticated;

GRANT SELECT ON public.entidade_responsaveis
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.e_responsavel_entidade(bigint)
  TO authenticated;

COMMIT;
