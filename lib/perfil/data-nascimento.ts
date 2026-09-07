'use server';
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Leitura/escrita da própria data de nascimento.
 *
 * `profiles.data_nascimento` não tem GRANT de SELECT nem UPDATE para
 * anon/authenticated (ver migration 20260907110000) — de propósito,
 * porque a policy de SELECT de `profiles` é `USING (true)` (perfis são
 * públicos) e um GRANT de coluna normal tornaria a data de nascimento de
 * toda a gente legível por qualquer utilizador autenticado, não só a
 * própria. Por isso o acesso passa sempre por aqui: confirma quem está
 * autenticado com o cliente normal (RLS), e só depois lê/escreve com
 * service role, sempre filtrado pelo id de quem chamou -- nunca um id
 * arbitrário vindo do cliente.
 */

export interface ResultadoAcao {
  sucesso: boolean;
  erro?: string;
}

export async function obterDataNascimento(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('data_nascimento')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data.data_nascimento;
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function atualizarDataNascimento(data: string | null): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { sucesso: false, erro: 'Não autenticado.' };

  if (data !== null) {
    if (!FORMATO_DATA.test(data)) {
      return { sucesso: false, erro: 'Data inválida.' };
    }
    const dataObj = new Date(`${data}T00:00:00Z`);
    const hoje = new Date();
    const limiteAntigo = new Date();
    limiteAntigo.setUTCFullYear(hoje.getUTCFullYear() - 120);

    if (Number.isNaN(dataObj.getTime()) || dataObj > hoje || dataObj < limiteAntigo) {
      return { sucesso: false, erro: 'Data fora de um intervalo razoável.' };
    }
  }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({ data_nascimento: data, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return { sucesso: false, erro: 'Não foi possível guardar a data de nascimento.' };
  }

  return { sucesso: true };
}
