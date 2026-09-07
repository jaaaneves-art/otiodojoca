'use server';
import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Verificação de username antes do registo — a peça que faltava.
 *
 * O registo em si já funciona (components/auth/register-form.tsx chama
 * supabase.auth.signUp() diretamente do browser, com o username em
 * options.data.username) e já está protegido contra duplicados por
 * `profiles_username_key` (unique) na base — mas isso só rejeita um
 * username já em uso por OUTRA conta. Nada verifica a tabela
 * `reserved_usernames` (nomes proibidos, ex. "admin", "otj", "suporte")
 * antes de deixar alguém registar-se com um deles.
 *
 * Uso previsto (Sprint 11, ainda por integrar no formulário): chamar
 * `usernameDisponivel(username)` a partir do RegisterForm antes de
 * chamar signUp — server action, invocável diretamente de um Client
 * Component.
 *
 * ATENÇÃO: não verifiquei se `reserved_usernames` já tem alguma linha —
 * não tenho acesso a correr uma query direta contra a base nesta sessão.
 * Se a tabela estiver vazia, esta função nunca vai bloquear nada; a
 * lista de palavras a proteger fica por decidir/popular.
 */
export interface VerificacaoUsername {
  disponivel: boolean;
  motivo?: 'reservado' | 'em_uso';
}

const FORMATO_USERNAME = /^[a-z0-9_]{3,20}$/;

export async function usernameDisponivel(usernameOriginal: string): Promise<VerificacaoUsername> {
  const username = usernameOriginal.trim().toLowerCase();

  // Formato básico — nada no schema impõe isto hoje (só NOT NULL +
  // UNIQUE), por isso fica aqui como primeira barreira.
  if (!FORMATO_USERNAME.test(username)) {
    return { disponivel: false, motivo: 'reservado' };
  }

  const admin = createAdminClient();

  const { data: reservado } = await admin
    .from('reserved_usernames')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (reservado) {
    return { disponivel: false, motivo: 'reservado' };
  }

  const { data: emUso } = await admin
    .from('profiles')
    .select('id')
    .eq('username', usernameOriginal.trim())
    .maybeSingle();

  if (emUso) {
    return { disponivel: false, motivo: 'em_uso' };
  }

  return { disponivel: true };
}
