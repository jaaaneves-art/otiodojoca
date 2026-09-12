-- ============================================================
-- RLS REFACTOR: social_comments + reactions — 5 RPC
-- ============================================================

BEGIN;

-- ========== SOCIAL_POST_COMMENTS ==========

-- 1. CRIAR COMENTÁRIO
CREATE OR REPLACE FUNCTION public.social_comentario_criar(
  p_post_id uuid,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_comment_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.social_posts WHERE id = p_post_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Post não encontrado ou deletado';
  END IF;

  IF public.e_menor_agora() AND NOT public.pode_publicar_fora_grupo() THEN
    RAISE EXCEPTION 'Menores de 18 não podem comentar fora de grupos';
  END IF;

  INSERT INTO public.social_post_comments (post_id, author_id, content)
  VALUES (p_post_id, auth.uid(), p_content)
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$;

-- 2. EDITAR COMENTÁRIO
CREATE OR REPLACE FUNCTION public.social_comentario_editar(
  p_comment_id uuid,
  p_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.social_post_comments
  SET content = p_content, updated_at = now()
  WHERE id = p_comment_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- 3. APAGAR COMENTÁRIO (soft delete)
CREATE OR REPLACE FUNCTION public.social_comentario_apagar(p_comment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.social_post_comments
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_comment_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ========== SOCIAL_POST_REACTIONS ==========

-- 4. ADICIONAR REAÇÃO
CREATE OR REPLACE FUNCTION public.social_reacao_adicionar(
  p_post_id uuid,
  p_reaction text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.social_posts WHERE id = p_post_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Post não encontrado ou deletado';
  END IF;

  INSERT INTO public.social_post_reactions (post_id, user_id, reaction)
  VALUES (p_post_id, auth.uid(), p_reaction)
  ON CONFLICT (post_id, user_id) DO UPDATE SET reaction = p_reaction, updated_at = now();

  RETURN true;
END;
$$;

-- 5. REMOVER REAÇÃO
CREATE OR REPLACE FUNCTION public.social_reacao_remover(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.social_post_reactions
  WHERE post_id = p_post_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================
-- POLICIES — RPC ONLY
-- ============================================================

DROP POLICY IF EXISTS social_comments_insert ON public.social_post_comments;
CREATE POLICY social_comments_insert ON public.social_post_comments
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS social_comments_update ON public.social_post_comments;
CREATE POLICY social_comments_update ON public.social_post_comments
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS social_comments_delete ON public.social_post_comments;
CREATE POLICY social_comments_delete ON public.social_post_comments
  FOR DELETE USING (false);

DROP POLICY IF EXISTS social_reactions_insert ON public.social_post_reactions;
CREATE POLICY social_reactions_insert ON public.social_post_reactions
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS social_reactions_update ON public.social_post_reactions;
CREATE POLICY social_reactions_update ON public.social_post_reactions
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS social_reactions_delete ON public.social_post_reactions;
CREATE POLICY social_reactions_delete ON public.social_post_reactions
  FOR DELETE USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.social_comentario_criar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.social_comentario_editar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.social_comentario_apagar(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.social_reacao_adicionar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.social_reacao_remover(uuid) TO authenticated;

COMMIT;
