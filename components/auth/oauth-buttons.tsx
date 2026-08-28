"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Provider } from "@supabase/supabase-js";

// Entrada por redes sociais -- pensada para utilizadores individuais
// (login/registo pessoal). As entidades parceiras continuam a usar
// email + palavra-passe nestas mesmas páginas (ver app/parceiros/page.tsx);
// uma futura SSO institucional (Google Workspace / Microsoft 365 do
// domínio da entidade) é um mecanismo diferente, ainda por implementar.
const PROVIDERS: { id: Provider; label: string; icon: JSX.Element }[] = [
  {
    id: "google",
    label: "Continuar com Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Continuar com Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.988h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        />
      </svg>
    ),
  },
];

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleOAuth(provider: Provider) {
    setError(null);
    setLoadingProvider(provider);

    const next = searchParams.get("next") || "/";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    // Em caso de sucesso o browser é imediatamente redirecionado para o
    // fornecedor -- só chegamos aqui se algo falhou antes disso (ex:
    // fornecedor não ativado no Supabase).
    if (oauthError) {
      setLoadingProvider(null);
      setError(
        "Não foi possível continuar com essa opção agora. Tenta novamente."
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuth(provider.id)}
          >
            {provider.icon}
            {loadingProvider === provider.id
              ? "A abrir..."
              : provider.label}
          </Button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-terra-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-terra-500">ou</span>
        </div>
      </div>
    </div>
  );
}
