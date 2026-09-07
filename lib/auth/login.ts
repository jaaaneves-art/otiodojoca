'use server';
import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Resolve "email OU username" para o email que supabase.auth.signInWithPassword()
 * precisa — o Supabase Auth só sabe autenticar por email, o username é um
 * conceito só deste projeto (coluna em `profiles`).
 *
 * components/auth/login-form.tsx hoje só aceita email. Este ficheiro não
 * está integrado no formulário ainda (Sprint 11) — uso previsto: no
 * submit do LoginForm, se o identificador não parecer um email, chamar
 * `resolverIdentificadorLogin(identificador)` (server action, invocável
 * de um Client Component) para obter o email antes de chamar
 * `supabase.auth.signInWithPassword({ email, password })`.
 *
 * A leitura usa service role de propósito: `profiles.email` não tem
 * GRANT de SELECT para "authenticated"/"anon" (só as colunas explicitamente
 * listadas em supabase/schemas/public/tables/profiles.sql têm GRANT —
 * avatar_url, bio, display_name, location, username, mfa_setup_dismissed_at
 * — email não está nessa lista, de propósito, para não vazar emails por
 * PostgREST). Sem service role, esta função nunca conseguiria ler o email.
 *
 * Devolve sempre `null` quando o username não existe (nunca um erro
 * distinto) — para não dar pistas de enumeração de contas a quem estiver
 * a tentar adivinhar usernames válidos.
 */
export async function resolverIdentificadorLogin(identificador: string): Promise<string | null> {
  const valor = identificador.trim();
  if (!valor) return null;

  // Parece email -- usa-se tal e qual, sem consultar a base.
  if (valor.includes('@')) return valor;

  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('email')
    .eq('username', valor)
    .maybeSingle();

  if (error || !data?.email) return null;

  return data.email;
}
