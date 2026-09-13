import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase com a secret key — ignora RLS (Row Level
// Security). USAR APENAS em código que corre no servidor (rotas de API,
// server actions, scripts). Nunca importar isto num Client Component nem
// expor SUPABASE_SECRET_KEY com o prefixo NEXT_PUBLIC_.
//
// Usado por rotas administrativas/de seed que precisam de escrever dados
// sem uma sessão de utilizador autenticado (ex: app/api/seed/route.ts).
//
// Nota (13 Set 2026): renomeado de SUPABASE_SERVICE_ROLE_KEY (formato
// legado, JWT) para SUPABASE_SECRET_KEY (formato novo da Supabase,
// prefixo sb_secret_), para ficar alinhado com o .env.local.

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY (ou NEXT_PUBLIC_SUPABASE_URL) não está definida em .env.local"
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
