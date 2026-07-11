"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ReplyForm({ threadId }: { threadId: number }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);
    setError(null);

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

    const { error: postError } = await supabase
      .from("posts")
      .insert({
        thread_id: threadId,
        author_id: user.id,
        content: content.trim(),
        is_first_post: false,
      });

    setLoading(false);

    if (postError) {
      console.error(postError);
      setError(postError.message);
      return;
    }

    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Escreve a tua resposta..."
        required
        className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "A responder..." : "Responder"}
      </Button>
    </form>
  );
}