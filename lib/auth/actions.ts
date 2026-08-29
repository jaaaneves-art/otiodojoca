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

/**
 * Desativa a verificação em duas etapas (MFA) -- remove todos os fatores
 * TOTP verificados da conta. Só disponível a utilizadores de nível "user":
 * para "moderator"/"admin" o MFA continua obrigatório (ver middleware,
 * lib/supabase/middleware.ts), por isso recusamos aqui também, mesmo que
 * o botão (só visível para "user" em app/perfil/page.tsx) seja contornado.
 */
export async function desativarMfa(): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { sucesso: false, erro: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "user") {
    return {
      sucesso: false,
      erro: "Esta conta é obrigada a ter a verificação em duas etapas ativa.",
    };
  }

  const { data: factorsData, error: listError } =
    await supabase.auth.mfa.listFactors();

  if (listError) {
    return {
      sucesso: false,
      erro: "Não foi possível verificar os fatores ativos.",
    };
  }

  const verificados =
    factorsData?.all?.filter(
      (f) => f.factor_type === "totp" && f.status === "verified"
    ) ?? [];

  for (const factor of verificados) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: factor.id,
    });
    if (unenrollError) {
      return {
        sucesso: false,
        erro: "Não foi possível desativar a verificação em duas etapas.",
      };
    }
  }

  return { sucesso: true };
}
