'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Mesmo padrão defensivo de app/admin/entidades/actions.ts
// (resolverPedido): o .select().single() depois do update não é só para
// devolver o registo -- é o que transforma um bloqueio silencioso da RLS
// (0 linhas afetadas, sem erro -- "Empresa gere as suas vagas", auth.uid()
// = empregos_empresas.profile_id) num erro explícito, em vez de a UI
// achar que mudou o estado sem nada ter mudado na base de dados. O
// .in('estado', estadosPermitidos) garante também que só se pode mudar de
// um estado válido de partida (ex.: não publicar uma vaga já fechada).
async function mudarEstadoVaga(
  id: number,
  novoEstado: 'publicada' | 'pausada' | 'fechada',
  estadosPermitidos: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('A tua sessão expirou. Entra novamente e tenta outra vez.');
  }

  const updateData: Record<string, unknown> = { estado: novoEstado };
  if (novoEstado === 'publicada') updateData.data_publicacao = new Date().toISOString();
  if (novoEstado === 'fechada') updateData.data_fecho = new Date().toISOString();

  const { data, error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)
    .in('estado', estadosPermitidos)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(
      `Não foi possível atualizar a vaga — ou não és o dono, ou o estado atual não permite esta ação. ${
        error?.message ?? ''
      }`
    );
  }

  revalidatePath('/empregos/empresa');
}

export async function publicarVaga(id: number) {
  await mudarEstadoVaga(id, 'publicada', ['rascunho', 'pausada']);
}

export async function pausarVaga(id: number) {
  await mudarEstadoVaga(id, 'pausada', ['publicada']);
}

export async function fecharVaga(id: number) {
  await mudarEstadoVaga(id, 'fechada', ['publicada', 'pausada']);
}

export async function reabrirVaga(id: number) {
  await mudarEstadoVaga(id, 'pausada', ['fechada']);
}
