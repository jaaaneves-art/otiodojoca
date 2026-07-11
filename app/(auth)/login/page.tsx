import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-center text-sm text-terra-600">
        Ainda nao tens conta?{" "}
        <Link href="/registo" className="font-medium text-terra-700 hover:underline">
          Regista-te aqui
        </Link>
      </p>
    </div>
  );
}
