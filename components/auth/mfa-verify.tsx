"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function MfaVerify() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadFactor() {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      // `data.totp` já só contém fatores verificados (ver tipos do
      // @supabase/auth-js) -- basta usar o primeiro.
      const verifiedTotp = data?.totp?.[0];

      if (listError || !verifiedTotp) {
        setError(
          "Não encontrámos nenhuma verificação em duas etapas ativa nesta conta."
        );
        setLoading(false);
        return;
      }

      setFactorId(verifiedTotp.id);
      setLoading(false);
    }

    loadFactor();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setSubmitting(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challenge) {
      setSubmitting(false);
      setError(
        "Não foi possível gerar o desafio de verificação. Tenta novamente."
      );
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setSubmitting(false);

    if (verifyError) {
      setError("Código inválido. Tenta novamente.");
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-terra-600">
          A verificar...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verify-code" className="text-sm font-medium">
              Código de 6 dígitos
            </label>
            <Input
              id="verify-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
              autoComplete="one-time-code"
              disabled={!factorId}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !factorId || code.length !== 6}
          >
            {submitting ? "A verificar..." : "Confirmar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
