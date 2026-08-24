import { NextResponse } from 'next/server';
import { criarReservaAlojamento } from '@/lib/alojamento/actions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alojamentoId = Number(id);

    if (!Number.isInteger(alojamentoId) || alojamentoId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.nome_hospede || !body.email_hospede || !body.data_entrada || !body.data_saida) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const reserva = await criarReservaAlojamento({
      alojamento_id: alojamentoId,
      nome_hospede: body.nome_hospede,
      email_hospede: body.email_hospede,
      telefone_hospede: body.telefone_hospede || undefined,
      data_entrada: body.data_entrada,
      data_saida: body.data_saida,
      num_pessoas: body.num_pessoas,
      num_quartos: body.num_quartos,
      tipo_refeicao: body.tipo_refeicao,
      preco_total: body.preco_total,
      observacoes: body.observacoes || undefined,
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
