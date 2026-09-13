'use server';

import { createClient } from '@/lib/supabase/server';

interface CriarReservaParams {
  restaurante_id: number;
  nome_cliente: string;
  email_cliente: string;
  telefone: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
  observacoes: string;
}

const LIMITE_ANTECEDENCIA_DIAS = 365;

function paraDataString(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function getTodayString(): string {
  return paraDataString(new Date());
}

function getDataMaximaString(): string {
  const limite = new Date();
  limite.setDate(limite.getDate() + LIMITE_ANTECEDENCIA_DIAS);
  return paraDataString(limite);
}

// Validação server-side (segurança) — a validação no cliente pode ser
// contornada com um pedido direto, por isso a data também é verificada aqui.
function validarDataReserva(dataReservaStr: string): string | null {
  if (dataReservaStr < getTodayString()) {
    return 'Não é possível fazer reservas para o passado.';
  }
  if (dataReservaStr > getDataMaximaString()) {
    return `Só é possível reservar com até ${LIMITE_ANTECEDENCIA_DIAS} dias de antecedência.`;
  }
  return null;
}

export async function criarReserva(params: CriarReservaParams) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: erroAuth,
    } = await supabase.auth.getUser();

    if (erroAuth || !user) {
      return { sucesso: false, erro: 'Deve iniciar sessão para criar uma reserva.' };
    }

    const erroData = validarDataReserva(params.data_reserva);
    if (erroData) {
      return { sucesso: false, erro: erroData };
    }

    // CORRIGIDO 13/09/2026 — deixou de fazer INSERT direto em
    // restaurante_reservas (bloqueado por RLS desde
    // 20260913030000_rls_refactor_reservas_rpc.sql) e passou a chamar a
    // RPC restaurante_reserva_criar(). p_telefone e p_observacoes foram
    // acrescentados à RPC em 20260913132355 porque este formulário
    // sempre recolheu os dois.
    const { error } = await supabase.rpc('restaurante_reserva_criar', {
      p_restaurante_id: params.restaurante_id,
      p_nome_cliente: params.nome_cliente,
      p_email_cliente: user.email || params.email_cliente,
      p_data_reserva: params.data_reserva,
      p_hora_reserva: params.hora_reserva,
      p_numero_pessoas: params.numero_pessoas,
      p_telefone: params.telefone,
      p_observacoes: params.observacoes,
    });

    if (error) {
      return { sucesso: false, erro: error.message };
    }

    return { sucesso: true };
  } catch (err) {
    return { sucesso: false, erro: 'Erro ao criar reserva. Tente novamente.' };
  }
}
