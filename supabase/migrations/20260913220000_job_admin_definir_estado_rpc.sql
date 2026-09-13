-- Bug encontrado a 13 Set ao auditar escrita directa remanescente
-- (pendentes item 5): a migration 20260913160000_fechar_bypass_rpc_only.sql
-- substituiu a policy ALL "Administradores gerem todas as vagas" por uma
-- versao SELECT-only (jobs_select_admin), partindo do pressuposto (errado)
-- de que nao havia escrita directa a jobs em lado nenhum da app. Na
-- verdade app/admin/empregos/actions.ts (rejeitarVagaAdmin,
-- reativarVagaAdmin, rejeitarVagaEResolverDenuncia) faz
-- .from('jobs').update({estado: ...}) directo com o cliente de sessao,
-- confiando nessa policy -- ficou partido desde essa migration (jobs_update
-- e USING (false), 0 linhas afectadas, o .select().single() a seguir
-- transforma isso num erro explicito para o admin, nao um bug silencioso,
-- mas a moderacao de vagas deixou de funcionar).
--
-- RPC no mesmo molde de job_publicar/_pausar/_reabrir/_fechar (SECURITY
-- DEFINER, verificacao interna de permissao em vez de depender de RLS de
-- escrita), mas usando e_admin() -- a fonte de verdade unica para "e
-- admin" convergida mais cedo hoje -- em vez do JOIN a empregos_empresas
-- que os outros job_* usam para "e dono da empresa".
BEGIN;

CREATE OR REPLACE FUNCTION public.job_admin_definir_estado(p_job_id bigint, p_novo_estado text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT e_admin() THEN
    RAISE EXCEPTION 'Não tem permissão para gerir esta vaga';
  END IF;

  IF p_novo_estado NOT IN ('rejeitada', 'pausada') THEN
    RAISE EXCEPTION 'Estado inválido para esta ação administrativa: %', p_novo_estado;
  END IF;

  UPDATE public.jobs
  SET estado = p_novo_estado, updated_at = now()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$function$;

COMMIT;
