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

function getTodayString(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Validação server-side (segurança) — a validação no cliente pode ser
// contornada com um pedido direto, por isso a data também é verificada aqui.
function validarDataReserva(dataReservaStr: string): string | null {
  if (dataReservaStr < getTodayString()) {
    return 'Não é possível fazer reservas para o passado.';
  }
  return null;
}

export async function criarReserva(params: CriarReservaParams) {
  try {
    const supabase = createClient();

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

    const { data, error } = await supabase
      .from('restaurante_reservas')
      .insert([
        {
          user_id: user.id,
          restaurante_id: params.restaurante_id,
          nome_cliente: params.nome_cliente,
          email_cliente: user.email || params.email_cliente,
          telefone: params.telefone,
          data_reserva: params.data_reserva,
          hora_reserva: params.hora_reserva,
          numero_pessoas: params.numero_pessoas,
          observacoes: params.observacoes,
        },
      ])

    if (error) {
      return { sucesso: false, erro: error.message };
    }

    return { sucesso: true };
  } catch (err) {
    return { sucesso: false, erro: 'Erro ao criar reserva. Tente novamente.' };
  }
}
