import { Suspense } from "react";
import { MfaSetup } from "@/components/auth/mfa-setup";
import { createClient } from "@/lib/supabase/server";

export default async function MfaSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let opcional = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    opcional = profile?.role === "user";
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold">Ativar verificação em duas etapas</h1>
        <p className="text-sm text-terra-600">
          {opcional
            ? "Recomendamos ativar a verificação em duas etapas para proteger a tua conta. Usa uma app como Google Authenticator, Authy ou 1Password."
            : "Por segurança, todas as contas têm de ter a verificação em duas etapas ativa. Usa uma app como Google Authenticator, Authy ou 1Password."}
        </p>
      </div>
      <Suspense fallback={null}>
        <MfaSetup opcional={opcional} />
      </Suspense>
    </div>
  );
}
