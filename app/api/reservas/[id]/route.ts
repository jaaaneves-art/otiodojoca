import { NextResponse } from 'next/server';
import { criarReservaAlojamento } from '@/lib/alojamento/actions';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RISCO-02 (docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md):
    // esta rota não tinha nenhuma verificação de sessão -- era um
    // segundo caminho, completamente anónimo, para criar reservas, a
    // contornar o login/MFA já exigido para chegar à página. A RLS
    // (auth.uid() = user_id) já bloqueia isto a nível da base de dados,
    // mas verificamos aqui também para devolver um 401 claro em vez de
    // um 500 genérico do erro lançado pela Server Action.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'É preciso iniciar sessão para fazer uma reserva.' },
        { status: 401 }
      );
    }

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
