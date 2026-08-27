import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-terra-600">
        Ainda nao tens conta?{" "}
        <Link href="/registo" className="font-medium text-terra-700 hover:underline">
          Regista-te aqui
        </Link>
      </p>
      <p className="mx-auto max-w-md text-center text-xs leading-relaxed text-terra-500">
        Entidades parceiras (Juntas de Freguesia, Municipios, Associacoes,
        Cooperativas, Organizacoes de Produtores...) entram aqui com o mesmo
        email e palavra-passe. A entrada por SSO com o email institucional da
        entidade esta planeada para uma fase futura.{" "}
        <Link href="/parceiros" className="underline hover:text-terra-700">
          Saber mais
        </Link>
      </p>
    </div>
  );
}
