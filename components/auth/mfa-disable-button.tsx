"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { desativarMfa } from "@/lib/auth/actions";

// Só aparece no perfil para utilizadores de nível "user" (ver
// app/perfil/page.tsx) -- para "moderator"/"admin" o MFA continua
// obrigatório, e a própria ação do servidor (lib/auth/actions.ts) recusa
// o pedido mesmo que este componente fosse usado noutro sítio por engano.
export function MfaDisableButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const resultado = await desativarMfa();

    setLoading(false);

    if (!resultado.sucesso) {
      setError(
        resultado.erro ?? "Não foi possível desativar a verificação em duas etapas."
      );
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-terra-600">
          Tens a certeza? A tua conta fica menos protegida sem a verificação
          em duas etapas.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "A desativar..." : "Sim, desativar"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={() => setConfirming(true)}>
      Desativar verificação em duas etapas
    </Button>
  );
}
