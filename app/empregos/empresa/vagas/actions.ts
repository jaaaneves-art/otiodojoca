'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// CORRIGIDO 13/09/2026 — deixou de fazer UPDATE direto em jobs (bloqueado
// por RLS desde 20260913040000_rls_refactor_jobs_rpc.sql) e passou a
// chamar as RPC job_publicar/job_pausar/job_fechar/job_reabrir (as três
// primeiras criadas/ajustadas em 20260913133544; job_fechar já existia
// mas ganhou aí a guarda de estado que esta função tinha e a RPC original
// não). Cada RPC replica a verificação de dono + transição de estado
// válida que o .in('estado', estadosPermitidos) fazia antes, agora dentro
// da própria função (RETURN FOUND = false se a condição não se verificar).
async function chamarRpcEstadoVaga(id: number, rpc: 'job_publicar' | 'job_pausar' | 'job_fechar' | 'job_reabrir') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('A tua sessão expirou. Entra novamente e tenta outra vez.');
  }

  const { data: sucesso, error } = await supabase.rpc(rpc, { p_job_id: id });

  if (error || !sucesso) {
    throw new Error(
      `Não foi possível atualizar a vaga — ou não és o dono, ou o estado atual não permite esta ação. ${
        error?.message ?? ''
      }`
    );
  }

  revalidatePath('/empregos/empresa');
}

export async function publicarVaga(id: number) {
  await chamarRpcEstadoVaga(id, 'job_publicar');
}

export async function pausarVaga(id: number) {
  await chamarRpcEstadoVaga(id, 'job_pausar');
}

export async function fecharVaga(id: number) {
  await chamarRpcEstadoVaga(id, 'job_fechar');
}

export async function reabrirVaga(id: number) {
  await chamarRpcEstadoVaga(id, 'job_reabrir');
}
