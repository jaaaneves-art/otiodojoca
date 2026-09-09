-- ============================================================
-- SPRINT 10 · o que falta mesmo — 06/09/2026
-- ============================================================
-- Substitui 01_SQL_AUDIT_TABLES.sql e 02_SQL_RLS_POLICIES.sql.
-- Aqueles não corriam e, do que faziam, quase tudo já existia.
--
-- Já existia na base, não é tocado:
--   username, role (enum user_role), RLS em profiles,
--   audit_log, two_factor_enabled, deleted_at
--
-- Decisões desta sessão:
--   · email_verified NÃO é criado — lê-se de auth.users.email_confirmed_at
--   · audit_logs NÃO é criado — usa-se a audit_log que já existe
--   · status sem valor 'deleted' — a coluna deleted_at já marca isso
--
-- ROLLBACK no fim do ficheiro.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. profiles: duas colunas em falta
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profiles_status CHECK (status IN ('active','suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status)
  WHERE status <> 'active';

COMMENT ON COLUMN public.profiles.status IS
  'active | suspended. A eliminacao marca-se em deleted_at, nao aqui.';

-- As colunas novas têm de entrar no GRANT por coluna criado hoje,
-- senão ficam invisíveis para a aplicação.
GRANT SELECT (status, last_login) ON public.profiles TO anon, authenticated;

-- ------------------------------------------------------------
-- 2. Verificação de email: sem coluna nova
-- ------------------------------------------------------------
-- auth.users.email_confirmed_at é a fonte. Uma coluna espelhada em
-- profiles seria mais um campo a divergir.
CREATE OR REPLACE FUNCTION public.email_verificado(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email_confirmed_at IS NOT NULL
  FROM auth.users WHERE id = p_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.email_verificado(uuid) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.email_verificado(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.email_verificado(uuid) IS
  'Le auth.users.email_confirmed_at. Substitui a coluna profiles.email_verified.';

-- ------------------------------------------------------------
-- 3. audit_log: duas colunas que faltavam
-- ------------------------------------------------------------
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS resource_id   uuid;

CREATE INDEX IF NOT EXISTS idx_audit_log_resource
  ON public.audit_log (resource_type, resource_id)
  WHERE resource_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON public.audit_log (created_at DESC);

-- A policy de INSERT existente aceita escrita de qualquer autenticado
-- (WITH CHECK true) — logs forjados. A escrita passa a ser so por
-- service role, que ignora RLS.
DROP POLICY IF EXISTS audit_log_insert_auth ON public.audit_log;
REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM anon, authenticated;

-- ------------------------------------------------------------
-- 4. email_audit_logs: nova, nao tem equivalente
-- ------------------------------------------------------------
-- Colunas alinhadas com a audit_log existente: ip (nao ip_address),
-- success (nao status), details (nao old_values/new_values).
CREATE TABLE IF NOT EXISTS public.email_audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject         text NOT NULL,
  template_used   text,
  success         boolean NOT NULL DEFAULT true,
  error_message   text,
  ip              inet,
  details         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_audit_user    ON public.email_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_email_audit_created ON public.email_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_falhas  ON public.email_audit_logs (created_at DESC)
  WHERE NOT success;

COMMENT ON TABLE public.email_audit_logs IS
  'Auditoria de emails (SendGrid). Escrita so por service role. Retencao 90 dias.';

ALTER TABLE public.email_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_audit_select_own ON public.email_audit_logs;
CREATE POLICY email_audit_select_own ON public.email_audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL    ON public.email_audit_logs FROM anon, authenticated;
GRANT  SELECT ON public.email_audit_logs TO authenticated;

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.email_audit_logs;
--   DROP FUNCTION IF EXISTS public.email_verificado(uuid);
--   ALTER TABLE public.audit_log DROP COLUMN IF EXISTS resource_type;
--   ALTER TABLE public.audit_log DROP COLUMN IF EXISTS resource_id;
--   CREATE POLICY audit_log_insert_auth ON public.audit_log
--     FOR INSERT WITH CHECK (true);
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_login;
-- COMMIT;
