"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message === "Invalid login credentials"
        ? "Email ou palavra-passe incorretos"
        : "Ocorreu um erro. Tenta novamente.");
      return;
    }

    // Palavra-passe correta -> falta confirmar o segundo fator (MFA é
    // obrigatório nesta plataforma). Decidimos o próximo ecrã com base no
    // nível de segurança (AAL) que esta sessão já tem.
    const next = searchParams.get("next") || "/perfil";
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    setLoading(false);

    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
      // Já tem um fator TOTP verificado -- só falta o desafio desta sessão.
      router.push(`/mfa/verify?next=${encodeURIComponent(next)}`);
    } else if (!aal || aal.nextLevel !== "aal2") {
      // Ainda não tem nenhum fator MFA configurado.
      router.push(`/mfa/setup?next=${encodeURIComponent(next)}`);
    } else {
      router.push(next);
    }
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Entra na comunidade do Almanaque</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="o.teu@email.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Palavra-passe</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </Button>
          <p className="text-center text-sm">
            <a href="/forgot-password" className="text-terra-600 hover:underline">
              Esqueceste-te da palavra-passe?
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
