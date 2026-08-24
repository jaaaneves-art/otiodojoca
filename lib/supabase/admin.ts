import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase com a service role key — ignora RLS (Row Level
// Security). USAR APENAS em código que corre no servidor (rotas de API,
// server actions, scripts). Nunca importar isto num Client Component nem
// expor SUPABASE_SERVICE_ROLE_KEY com o prefixo NEXT_PUBLIC_.
//
// Usado por rotas administrativas/de seed que precisam de escrever dados
// sem uma sessão de utilizador autenticado (ex: app/api/seed/route.ts).

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) não está definida em .env.local"
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
