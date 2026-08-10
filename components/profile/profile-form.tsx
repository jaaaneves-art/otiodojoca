"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
}

export function ProfileForm({
  initialProfile,
  userId,
}: {
  initialProfile: Profile | null;
  userId: string;
}) {
  const [form, setForm] = useState({
    username: initialProfile?.username || "",
    display_name: initialProfile?.display_name || "",
    bio: initialProfile?.bio || "",
    location: initialProfile?.location || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: form.username,
        display_name: form.display_name || null,
        bio: form.bio || null,
        location: form.location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setLoading(false);

    if (error) {
      setMessage("Erro ao guardar. O nome de utilizador pode ja existir.");
    } else {
      setMessage("Perfil atualizado com sucesso!");
      router.refresh();
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome de utilizador</label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome a mostrar</label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Como queres ser chamado?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Localizacao</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Concelho ou freguesia"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Conta-nos um pouco sobre ti..."
              rows={4}
              className="flex w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
            />
          </div>
          {message && (
            <p className={`text-sm p-3 rounded-lg ${
              message.includes("sucesso")
                ? "text-green-700 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}>
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/perfil")}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
