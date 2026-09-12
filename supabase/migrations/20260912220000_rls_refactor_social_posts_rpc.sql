-- ============================================================
-- RLS REFACTOR: social_posts — 3 RPC
-- ============================================================

BEGIN;

-- 1. CRIAR POST
CREATE OR REPLACE FUNCTION public.social_post_criar(
  p_content text,
  p_visibility text DEFAULT 'public'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_id uuid;
BEGIN
  INSERT INTO public.social_posts (author_id, content, visibility)
  VALUES (auth.uid(), p_content, p_visibility)
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$;

-- 2. EDITAR POST
CREATE OR REPLACE FUNCTION public.social_post_editar(
  p_post_id uuid,
  p_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.social_posts
  SET content = p_content, updated_at = now()
  WHERE id = p_post_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- 3. APAGAR POST (soft delete)
CREATE OR REPLACE FUNCTION public.social_post_apagar(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.social_posts
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_post_id AND author_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================
-- POLICIES — RPC ONLY (nenhum INSERT/UPDATE/DELETE direto)
-- ============================================================

DROP POLICY IF EXISTS social_posts_select ON public.social_posts;
CREATE POLICY social_posts_select ON public.social_posts
  FOR SELECT USING (
    (deleted_at IS NULL AND visibility = 'public')
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS social_posts_insert ON public.social_posts;
CREATE POLICY social_posts_insert ON public.social_posts
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS social_posts_update ON public.social_posts;
CREATE POLICY social_posts_update ON public.social_posts
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS social_posts_delete ON public.social_posts;
CREATE POLICY social_posts_delete ON public.social_posts
  FOR DELETE USING (false);

-- ============================================================
-- GRANTS — Só RPC
-- ============================================================

GRANT EXECUTE ON FUNCTION public.social_post_criar(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.social_post_editar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.social_post_apagar(uuid) TO authenticated;

COMMIT;
