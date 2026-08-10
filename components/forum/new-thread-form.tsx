"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateSlug } from "@/lib/utils/slug";

export function NewThreadForm({ categoryId }: { categoryId: number }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Obter utilizador autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("É necessário iniciar sessão.");
        setLoading(false);
        return;
      }

      const slug = generateSlug(title);

      // Criar tópico
      const { data: thread, error: threadError } = await supabase
        .from("threads")
        .insert({
          author_id: user.id,
          category_id: categoryId,
          title,
          slug,
        })
        .select()
        .single();

      if (threadError) {
        console.error("THREAD ERROR:", threadError);
        setError(threadError.message);
        setLoading(false);
        return;
      }

      // Criar primeira mensagem
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          thread_id: thread.id,
          author_id: user.id,
          content,
          is_first_post: true,
        });

      if (postError) {
        console.error("POST ERROR:", postError);
        setError(postError.message);
        setLoading(false);
        return;
      }

      router.push(`/forum/topico/${thread.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro inesperado.");
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Tópico</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-sm font-medium">
              Título
            </label>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quando plantar tomates no Alentejo?"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Mensagem
            </label>

            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreve a tua dúvida..."
              required
              className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "A publicar..." : "Publicar tópico"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}