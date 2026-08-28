import { Suspense } from "react";
import { MfaVerify } from "@/components/auth/mfa-verify";

export default function MfaVerifyPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold">Verificação em duas etapas</h1>
        <p className="text-sm text-terra-600">
          Introduz o código de 6 dígitos gerado pela tua app de autenticação.
        </p>
      </div>
      <Suspense fallback={null}>
        <MfaVerify />
      </Suspense>
    </div>
  );
}
