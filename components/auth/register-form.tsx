"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        // Bug encontrado em 2026-08-27: sem isto, o link do email de
        // confirmação aponta sempre para o Site URL puro (ex:
        // "localhost:3000/?code=xxx"), nunca para "/auth/callback" -- a
        // única rota que troca esse código por uma sessão
        // (exchangeCodeForSession). O código ficava pendurado na página
        // errada, sem nunca ser trocado por sessão da forma esperada.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setError(
        error.message.includes("already registered")
          ? "Este email ja esta registado"
          : "Ocorreu um erro. Tenta novamente."
      );
      return;
    }

    setLoading(false);

    if (!data.session) {
      // A confirmação de email está ativa neste projeto -- ainda não há
      // sessão para configurar o MFA.
      setInfo(
        "Verifica o teu email para confirmares a conta. Depois de confirmares, o próximo passo é ativar a verificação em duas etapas."
      );
      return;
    }

    // MFA é obrigatório para todas as contas -- toda a gente nova
    // passa sempre por aqui a seguir ao registo.
    const next = searchParams.get("next") || "/";
    router.push(`/mfa/setup?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Junta-te a comunidade do Almanaque</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButtons />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Nome de utilizador</label>
            <Input
              id="username"
              placeholder="joao_agricultor"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
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
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
          {info && (
            <p className="text-sm text-terra-700 bg-terra-50 p-3 rounded-lg">{info}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
