"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_IMAGENS = 5;
const MAX_TAMANHO_MB = 5;

export function ReplyForm({ threadId }: { threadId: number }) {
  const [content, setContent] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  function handleImagensChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imagens.length + files.length > MAX_IMAGENS) {
      setError(`Máximo ${MAX_IMAGENS} imagens por resposta`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_TAMANHO_MB * 1024 * 1024) {
        setError(`Cada imagem tem de ter menos de ${MAX_TAMANHO_MB}MB`);
        return;
      }
    }

    setError(null);
    setImagens((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removerImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImagens(postId: number) {
    for (let i = 0; i < imagens.length; i++) {
      const file = imagens[i];
      const fileName = `${postId}-${i}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = `${postId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("forum-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("[uploadImagens] Erro no upload:", uploadError);
        continue;
      }

      const { data } = supabase.storage.from("forum-images").getPublicUrl(filePath);

      await supabase.from("post_images").insert({
        post_id: postId,
        storage_path: data.publicUrl,
        sort_order: i,
      });
    }
  }

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

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        thread_id: threadId,
        author_id: user.id,
        content: content.trim(),
        is_first_post: false,
      })
      .select()
      .single();

    if (postError || !post) {
      console.error(postError);
      setError(postError?.message || "Erro ao responder");
      setLoading(false);
      return;
    }

    if (imagens.length > 0) {
      await uploadImagens(post.id);
    }

    setLoading(false);
    setContent("");
    setImagens([]);
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

      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagensChange}
          className="block w-full text-sm text-terra-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-terra-100 file:text-terra-700 file:text-sm hover:file:bg-terra-200"
        />

        {imagens.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 max-w-sm">
            {imagens.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-20 object-cover rounded-lg border border-terra-200"
                />
                <button
                  type="button"
                  onClick={() => removerImagem(index)}
                  className="absolute -top-2 -right-2 bg-white border border-terra-300 rounded-full w-6 h-6 text-xs text-terra-700 hover:bg-terra-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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