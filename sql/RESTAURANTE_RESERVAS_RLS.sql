-- ============================================================
-- OTJ - COMER
-- RESTAURANTE_RESERVAS — user_id + RLS
-- ============================================================
-- Estado: coluna user_id já existia — liga apenas FK, RLS e policies.

-- ============================================================================
-- Step 1: Foreign key para auth.users
-- ============================================================================

ALTER TABLE public.restaurante_reservas
ADD CONSTRAINT fk_restaurante_reservas_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- ============================================================================
-- Step 2: Índices
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_restaurante_reservas_user_id
ON public.restaurante_reservas(user_id);

CREATE INDEX IF NOT EXISTS idx_restaurante_reservas_email_cliente
ON public.restaurante_reservas(email_cliente);

-- ============================================================================
-- Step 3: Ativar RLS
-- ============================================================================

ALTER TABLE public.restaurante_reservas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: Policies (drop + recreate, idempotente)
-- ============================================================================

DROP POLICY IF EXISTS "users_can_create_own_reservation" ON public.restaurante_reservas;
DROP POLICY IF EXISTS "users_can_view_own_reservations" ON public.restaurante_reservas;
DROP POLICY IF EXISTS "users_can_update_own_reservation" ON public.restaurante_reservas;
DROP POLICY IF EXISTS "users_can_delete_own_reservation" ON public.restaurante_reservas;

-- Policy 1: criar apenas a própria reserva
CREATE POLICY "users_can_create_own_reservation"
ON public.restaurante_reservas
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR user_id IS NULL  -- permite migração de dados históricos
);

-- Policy 2: ver apenas as próprias reservas
CREATE POLICY "users_can_view_own_reservations"
ON public.restaurante_reservas
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 3: atualizar apenas a própria reserva
CREATE POLICY "users_can_update_own_reservation"
ON public.restaurante_reservas
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: cancelar apenas a própria reserva
CREATE POLICY "users_can_delete_own_reservation"
ON public.restaurante_reservas
FOR DELETE
USING (auth.uid() = user_id);
