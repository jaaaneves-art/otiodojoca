"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/imoveis/mensagens/actions";

export default function MessageForm({ conversationId }: { conversationId: number }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);

    const formData = new FormData();
    formData.append("conversationId", conversationId.toString());
    formData.append("content", content);

    try {
      await sendMessage(formData);
      setContent("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Escreve uma mensagem..."
        className="flex-1 border border-imoveis-200 rounded-lg p-3 resize-none focus:outline-none focus:border-imoveis-600"
      />
      <button
        type="submit"
        disabled={sending || !content.trim()}
        className="bg-imoveis-600 text-white font-medium px-5 rounded-lg hover:bg-imoveis-700 disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
}
