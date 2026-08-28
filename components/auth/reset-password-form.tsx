"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LinkStatus = "checking" | "valid" | "invalid";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<LinkStatus>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setStatus(data.user ? "valid" : "invalid");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError("Não foi possível atualizar a palavra-passe. Tenta pedir um novo link.");
      return;
    }

    router.push("/login");
  }

  if (status === "checking") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-terra-600">
          A verificar o link...
        </CardContent>
      </Card>
    );
  }

  if (status === "invalid") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center text-sm text-terra-600">
          Este link de recuperação é inválido ou expirou.{" "}
          <a href="/forgot-password" className="underline">Pede um novo</a>.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Nova palavra-passe</CardTitle>
        <CardDescription>Escolhe uma nova palavra-passe para a tua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Nova palavra-passe</label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A atualizar..." : "Atualizar palavra-passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
