'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function resolverPedido(id: number, novoEstado: 'aprovado' | 'rejeitado') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('A tua sessão expirou. Entra novamente e tenta outra vez.');
  }

  // A RLS de entidade_pedidos ("Administradores gerem todos os pedidos",
  // profiles.role = 'admin' desde a migration
  // 20260827100000_entidade_pedidos_rls_usar_role.sql — antes disso era
  // profiles.is_admin = true, ver LACUNA-07) é quem decide, de facto, se
  // esta escrita passa. .select().single() aqui não é só para devolver
  // o registo — é
  // o que transforma um bloqueio silencioso da RLS (0 linhas afetadas,
  // sem erro) num erro explícito, em vez de a UI achar que resolveu o
  // pedido sem nada ter mudado na base de dados.
  const { data, error } = await supabase
    .from('entidade_pedidos')
    .update({
      estado: novoEstado,
      resolvido_por: user.id,
      resolvido_em: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('estado', 'pendente')
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(
      `Não foi possível atualizar o pedido — ou já não é administrador, ou o pedido já não está pendente. ${
        error?.message ?? ''
      }`
    );
  }

  revalidatePath('/admin/entidades');
}

export async function aprovarPedido(id: number) {
  await resolverPedido(id, 'aprovado');
}

export async function rejeitarPedido(id: number) {
  await resolverPedido(id, 'rejeitado');
}
