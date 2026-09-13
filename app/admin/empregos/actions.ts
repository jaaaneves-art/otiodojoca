'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Até 13 Set isto fazia .from('jobs').update(...) direto, confiando na
// policy ALL "Administradores gerem todas as vagas" (profiles.role =
// 'admin', migration 20260830203000_empregos_module_fase8.sql). Essa
// policy foi substituída nesse mesmo dia por uma versão SELECT-only
// (jobs_select_admin, migration 20260913160000_fechar_bypass_rpc_only.sql)
// a fechar o bypass de RPC-only geral -- partiu esta função sem se dar
// por isso (achado ao auditar escrita directa remanescente, pendentes
// item 5). Corrigido com uma RPC dedicada no mesmo molde de
// job_publicar/_pausar/_reabrir/_fechar (SECURITY DEFINER, verificação
// interna via e_admin() em vez de depender de RLS de escrita) -- ver
// migration job_admin_definir_estado_rpc, 13 Set.
//
// Sem filtro por estado atual (ao contrário de vagas/actions.ts, que
// só deixa a empresa publicar a partir de rascunho/pausada, etc.):
// aqui um admin pode sempre repetir a mesma ação (ex: rejeitar uma
// vaga já rejeitada por causa de uma segunda denúncia) sem que isso
// seja tratado como erro.
async function definirEstadoVagaAdmin(jobId: number, novoEstado: 'rejeitada' | 'pausada') {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('job_admin_definir_estado', {
    p_job_id: jobId,
    p_novo_estado: novoEstado,
  });

  if (error || !data) {
    throw new Error(
      `Não foi possível atualizar a vaga -- confirma que ainda és administrador. ${error?.message ?? ''}`
    );
  }

  revalidatePath('/admin/empregos');
  revalidatePath(`/empregos/${jobId}`);
}

export async function rejeitarVagaAdmin(jobId: number) {
  await definirEstadoVagaAdmin(jobId, 'rejeitada');
}

// Repõe a vaga como 'pausada', nunca diretamente 'publicada' -- a
// empresa tem de republicar explicitamente (ver nota de decisão no
// cabeçalho da migration da Fase 8).
export async function reativarVagaAdmin(jobId: number) {
  await definirEstadoVagaAdmin(jobId, 'pausada');
}

async function resolverDenuncia(
  reportId: number,
  novoEstado: 'resolvida' | 'ignorada',
  notaAdmin?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('A tua sessão expirou. Entra novamente e tenta outra vez.');
  }

  const { data, error } = await supabase
    .from('job_reports')
    .update({
      estado: novoEstado,
      resolvido_por: user.id,
      resolvido_em: new Date().toISOString(),
      nota_admin: notaAdmin ?? null,
    })
    .eq('id', reportId)
    .eq('estado', 'pendente')
    .select('id, job_id')
    .single();

  if (error || !data) {
    throw new Error(
      `Não foi possível atualizar a denúncia -- confirma que ainda és administrador ou que ela já não está pendente. ${
        error?.message ?? ''
      }`
    );
  }

  revalidatePath('/admin/empregos');
  return data;
}

export async function ignorarDenuncia(reportId: number) {
  await resolverDenuncia(reportId, 'ignorada');
}

// Ação combinada do botão principal na lista de denúncias pendentes:
// rejeita a vaga denunciada e marca a denúncia como resolvida num só
// passo. definirEstadoVagaAdmin() não tem guarda de estado atual, por
// isso funciona mesmo que a vaga já tenha sido rejeitada entretanto
// (ex: por outra denúncia sobre a mesma vaga).
export async function rejeitarVagaEResolverDenuncia(reportId: number, jobId: number) {
  await definirEstadoVagaAdmin(jobId, 'rejeitada');
  await resolverDenuncia(reportId, 'resolvida', 'Vaga rejeitada por um administrador.');
}
