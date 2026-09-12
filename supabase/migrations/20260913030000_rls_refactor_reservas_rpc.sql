-- ============================================================
-- RLS REFACTOR: restaurante_reservas + reservas_alojamento
-- ============================================================

BEGIN;

-- ========== RESTAURANTE_RESERVAS ==========

CREATE OR REPLACE FUNCTION public.restaurante_reserva_criar(
  p_restaurante_id bigint,
  p_nome_cliente text,
  p_email_cliente text,
  p_data_reserva date,
  p_hora_reserva time,
  p_numero_pessoas bigint
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reserva_id bigint;
BEGIN
  INSERT INTO public.restaurante_reservas (
    restaurante_id, user_id, nome_cliente, email_cliente, 
    data_reserva, hora_reserva, numero_pessoas
  )
  VALUES (
    p_restaurante_id, auth.uid(), p_nome_cliente, p_email_cliente,
    p_data_reserva, p_hora_reserva, p_numero_pessoas
  )
  RETURNING id INTO v_reserva_id;

  RETURN v_reserva_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restaurante_reserva_editar(
  p_reserva_id bigint,
  p_data_reserva date,
  p_hora_reserva time
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.restaurante_reservas
  SET data_reserva = p_data_reserva, hora_reserva = p_hora_reserva
  WHERE id = p_reserva_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.restaurante_reserva_cancelar(p_reserva_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.restaurante_reservas
  WHERE id = p_reserva_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ========== RESERVAS_ALOJAMENTO ==========

CREATE OR REPLACE FUNCTION public.alojamento_reserva_criar(
  p_alojamento_id bigint,
  p_nome_hospede text,
  p_email_hospede text,
  p_data_entrada date,
  p_data_saida date,
  p_num_pessoas integer,
  p_tipo_refeicao text,
  p_preco_total numeric
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reserva_id bigint;
BEGIN
  INSERT INTO public.reservas_alojamento (
    alojamento_id, user_id, nome_hospede, email_hospede,
    data_entrada, data_saida, num_pessoas, num_quartos,
    tipo_refeicao, preco_total, status
  )
  VALUES (
    p_alojamento_id, auth.uid(), p_nome_hospede, p_email_hospede,
    p_data_entrada, p_data_saida, p_num_pessoas, 1,
    p_tipo_refeicao, p_preco_total, 'pendente'
  )
  RETURNING id INTO v_reserva_id;

  RETURN v_reserva_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.alojamento_reserva_editar(
  p_reserva_id bigint,
  p_data_entrada date,
  p_data_saida date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.reservas_alojamento
  SET data_entrada = p_data_entrada, data_saida = p_data_saida, updated_at = now()
  WHERE id = p_reserva_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.alojamento_reserva_cancelar(p_reserva_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.reservas_alojamento
  SET status = 'cancelada', updated_at = now()
  WHERE id = p_reserva_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================
-- POLICIES — RPC ONLY
-- ============================================================

DROP POLICY IF EXISTS restaurante_reservas_insert ON public.restaurante_reservas;
CREATE POLICY restaurante_reservas_insert ON public.restaurante_reservas FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS restaurante_reservas_update ON public.restaurante_reservas;
CREATE POLICY restaurante_reservas_update ON public.restaurante_reservas FOR UPDATE USING (false);

DROP POLICY IF EXISTS restaurante_reservas_delete ON public.restaurante_reservas;
CREATE POLICY restaurante_reservas_delete ON public.restaurante_reservas FOR DELETE USING (false);

DROP POLICY IF EXISTS reservas_alojamento_insert ON public.reservas_alojamento;
CREATE POLICY reservas_alojamento_insert ON public.reservas_alojamento FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS reservas_alojamento_update ON public.reservas_alojamento;
CREATE POLICY reservas_alojamento_update ON public.reservas_alojamento FOR UPDATE USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.restaurante_reserva_criar(bigint, text, text, date, time, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restaurante_reserva_editar(bigint, date, time) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restaurante_reserva_cancelar(bigint) TO authenticated;

GRANT EXECUTE ON FUNCTION public.alojamento_reserva_criar(bigint, text, text, date, date, integer, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.alojamento_reserva_editar(bigint, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.alojamento_reserva_cancelar(bigint) TO authenticated;

COMMIT;
