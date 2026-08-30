'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
    .select('id, tipo_entidade, profile_id, nome_entidade, nipc, municipio_id, freguesia_id')
    .single();

  if (error || !data) {
    throw new Error(
      `Não foi possível atualizar o pedido — ou já não é administrador, ou o pedido já não está pendente. ${
        error?.message ?? ''
      }`
    );
  }

  // Empregador aprovado: ao contrário dos outros tipos (cuja ligação a
  // `entidades` fica mesmo para um passo manual à parte, ver nota na
  // página), aqui o "registo" em empregos_empresas É o próprio acesso ao
  // painel de empresa — não faz sentido pedir um segundo passo manual só
  // para isto. A escrita no `entidade_pedidos` acima já passou pela RLS
  // ("Administradores gerem todos os pedidos", profiles.role = 'admin'),
  // por isso já sabemos que quem chamou esta função é admin; usamos o
  // cliente com a service role só a partir daqui, porque a RLS de
  // empregos_empresas ("Empresa gere o seu perfil", auth.uid() =
  // profile_id) bloquearia silenciosamente um insert feito em nome de
  // outro utilizador (o requerente, não o admin autenticado).
  if (novoEstado === 'aprovado' && data.tipo_entidade === 'empregador') {
    const admin = createAdminClient();

    const { data: existente, error: existenteError } = await admin
      .from('empregos_empresas')
      .select('id')
      .eq('profile_id', data.profile_id)
      .maybeSingle();

    if (existenteError) {
      throw new Error(
        `Pedido aprovado, mas falhou verificar se já existia empresa: ${existenteError.message}`
      );
    }

    if (!existente) {
      const { error: empresaError } = await admin.from('empregos_empresas').insert({
        profile_id: data.profile_id,
        nome_empresa: data.nome_entidade,
        nipc: data.nipc,
        municipio_id: data.municipio_id,
        freguesia_id: data.freguesia_id,
        estado: 'aprovado',
      });

      if (empresaError) {
        throw new Error(
          `Pedido aprovado, mas falhou criar o acesso de empresa: ${empresaError.message}`
        );
      }
    }
  }

  revalidatePath('/admin/entidades');
}

export async function aprovarPedido(id: number) {
  await resolverPedido(id, 'aprovado');
}

export async function rejeitarPedido(id: number) {
  await resolverPedido(id, 'rejeitado');
}
