"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

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

    setLoading(false);

    // Não decidir aqui se é preciso passar por /mfa/setup ou /mfa/verify --
    // essa decisão já é feita pelo middleware (lib/supabase/middleware.ts),
    // que também sabe se o utilizador já dispensou a sugestão de MFA
    // ("Agora não"). Duplicar a lógica aqui (como acontecia antes, só a
    // olhar para o AAL) ignorava essa dispensa e voltava a mostrar o QR em
    // todos os logins seguintes, mesmo depois de o utilizador já ter dito
    // que não queria configurar. Navegar sempre para o destino e deixar o
    // middleware redirecionar se for mesmo preciso.
    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Entra na comunidade do Almanaque</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButtons />
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
