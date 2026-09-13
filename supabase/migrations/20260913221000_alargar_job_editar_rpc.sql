-- Segundo bug encontrado na mesma auditoria (pendentes item 5, 13 Set):
-- app/empregos/empresa/vagas/[id]/editar/page.tsx (atualizarVaga(), a
-- página real de edição de vaga pela empresa) faz
-- .from('jobs').update({titulo, descricao, categoria, modalidade,
-- tipo_contrato, nivel_experiencia, nivel_formacao_minimo, salario_min,
-- salario_max, municipio_id}) direto, confiando na policy ALL "Empresa
-- gere as suas vagas" -- substituída por SELECT-only na mesma migration
-- de hoje que corrigiu o P0 NOVO (20260913160000_fechar_bypass_rpc_only.sql).
-- Ao contrário de atualizarStatusReserva/cancelarReserva em
-- lib/alojamento/actions.ts (confirmado código morto), esta função É
-- chamada -- é a própria página de editar vaga, ficou partida.
--
-- job_editar() já existia mas só cobria 4 dos 10 campos que o formulário
-- de edição envia -- alargada para cobrir todos, no mesmo espírito da
-- migration de hoje 20260913170000_alargar_marketplace_ad_editar.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.job_editar(
  p_job_id bigint,
  p_titulo text,
  p_descricao text,
  p_salario_min numeric DEFAULT NULL::numeric,
  p_salario_max numeric DEFAULT NULL::numeric,
  p_categoria text DEFAULT NULL::text,
  p_modalidade text DEFAULT NULL::text,
  p_tipo_contrato text DEFAULT NULL::text,
  p_nivel_experiencia text DEFAULT NULL::text,
  p_nivel_formacao_minimo text DEFAULT NULL::text,
  p_municipio_id bigint DEFAULT NULL::bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.empregos_empresas ee ON ee.id = j.empresa_id
    WHERE j.id = p_job_id AND ee.profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não tem permissão para editar esta vaga';
  END IF;

  -- COALESCE nos campos novos: uma chamada antiga (só titulo/descricao/
  -- salarios, ex.: se alguma vier a existir) não apaga categoria/
  -- modalidade/etc já gravados. municipio_id e obrigatorio no formulario
  -- de edicao mas tambem leva COALESCE por seguranca (nunca queremos um
  -- NULL acidental a apagar a localizacao da vaga).
  UPDATE public.jobs
  SET titulo = p_titulo,
      descricao = p_descricao,
      salario_min = p_salario_min,
      salario_max = p_salario_max,
      categoria = COALESCE(p_categoria, categoria),
      modalidade = COALESCE(p_modalidade, modalidade),
      tipo_contrato = COALESCE(p_tipo_contrato, tipo_contrato),
      nivel_experiencia = COALESCE(p_nivel_experiencia, nivel_experiencia),
      nivel_formacao_minimo = COALESCE(p_nivel_formacao_minimo, nivel_formacao_minimo),
      municipio_id = COALESCE(p_municipio_id, municipio_id),
      updated_at = now()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.job_editar(bigint, text, text, numeric, numeric, text, text, text, text, text, bigint) TO authenticated;

COMMIT;

-- CREATE OR REPLACE não substitui uma função quando a assinatura muda de
-- número de parâmetros -- ficou um overload antigo (5 parâmetros) a par
-- do novo (11 parâmetros) acima. Nunca foi chamada pela app (RPC órfã,
-- confirmado hoje mais cedo), mas duas versões da mesma função com nomes
-- de parâmetros diferentes é uma armadilha para uma sessão futura chamar
-- sem querer a errada -- apagada.
DROP FUNCTION IF EXISTS public.job_editar(bigint, text, text, numeric, numeric);
