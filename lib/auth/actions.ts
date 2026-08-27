"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResultadoAcao {
  sucesso: boolean;
  erro?: string;
}

/**
 * Regista que o utilizador dispensou a sugestão de configurar o MFA.
 * Só tem efeito prático para utilizadores de nível "user" -- o middleware
 * (lib/supabase/middleware.ts) é quem decide se o MFA continua obrigatório
 * consoante o `role` do perfil.
 */
export async function dispensarConfiguracaoMfa(): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { sucesso: false, erro: "Não autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ mfa_setup_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { sucesso: false, erro: "Não foi possível guardar a preferência." };
  }

  return { sucesso: true };
}
