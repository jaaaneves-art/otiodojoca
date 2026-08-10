import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
      <p className="text-center text-sm text-terra-600">
        Ja tens conta?{" "}
        <Link href="/login" className="font-medium text-terra-700 hover:underline">
          Entra aqui
        </Link>
      </p>
    </div>
  );
}
