"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dispensarConfiguracaoMfa } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stage = "loading" | "qr" | "error";

interface MfaSetupProps {
  /** Quando true, mostra a opção "Agora não" (nível "user"). */
  opcional?: boolean;
}

export function MfaSetup({ opcional = false }: MfaSetupProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dispensando, setDispensando] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function startEnrollment() {
      setStage("loading");
      setError(null);

      // Remove TODOS os fatores TOTP anteriores que tenham ficado por
      // confirmar (ex: o utilizador saiu a meio de configurações
      // anteriores, em testes sucessivos). O Supabase recusa (422) um
      // novo enroll() enquanto existir QUALQUER fator TOTP "unverified"
      // pendente -- e podem existir vários acumulados, não só um.
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const pendingTotps =
        factorsData?.all?.filter(
          (f) => f.factor_type === "totp" && f.status === "unverified"
        ) ?? [];

      if (pendingTotps.length > 0) {
        await Promise.all(
          pendingTotps.map((f) =>
            // Se o fator já não existir (ex: expirou entretanto do lado
            // do servidor), o unenroll falha com 404 -- ignoramos, o
            // objetivo é só garantir que nenhum fica para trás.
            supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {})
          )
        );
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (cancelled) return;

      if (enrollError || !data) {
        setError("Não foi possível iniciar a configuração. Tenta novamente.");
        setStage("error");
        return;
      }

      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStage("qr");
    }

    startEnrollment();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(e: React.FormEvent) {
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
      setError(
        "Código inválido. Confirma o código na tua app de autenticação e tenta de novo."
      );
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  async function handleDispensar() {
    setDispensando(true);
    setError(null);

    const resultado = await dispensarConfiguracaoMfa();

    if (!resultado.sucesso) {
      setDispensando(false);
      setError(resultado.erro ?? "Não foi possível guardar a preferência.");
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  if (stage === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-terra-600">
          A preparar a configuração...
        </CardContent>
      </Card>
    );
  }

  if (stage === "error") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-base">1. Digitaliza o código QR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {qrSvg && (
          <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg border flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI, next/image não aplica aqui */}
            <img
              src={
                qrSvg.startsWith("data:")
                  ? qrSvg
                  : `data:image/svg+xml;utf-8,${encodeURIComponent(qrSvg)}`
              }
              alt="Código QR para configurar a app de autenticação"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {secret && (
          <p className="text-center text-xs text-terra-600 break-all">
            Não consegues digitalizar? Introduz manualmente:{" "}
            <span className="font-mono font-medium">{secret}</span>
          </p>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="mfa-code" className="text-sm font-medium">
              2. Introduz o código de 6 dígitos
            </label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoComplete="one-time-code"
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
            disabled={submitting || dispensando || code.length !== 6}
          >
            {submitting ? "A confirmar..." : "Confirmar e ativar"}
          </Button>

          {opcional && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleDispensar}
              disabled={submitting || dispensando}
            >
              {dispensando ? "A guardar..." : "Agora não"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
