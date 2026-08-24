"use client";

import { useState } from "react";
import { sendMessage } from "@/app/mercado-da-terra/messages/actions";

export default function MessageForm({ conversationId }: { conversationId: number }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter para enviar, Shift+Enter para nova linha
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Escreve uma mensagem..."
        required
        className="flex-1 border border-terra-200 rounded-2xl px-4 py-2 focus:outline-none focus:border-terra-600 resize-none max-h-32"
      />
      <button
        type="submit"
        disabled={sending || !content.trim()}
        className="bg-terra-600 text-white font-medium py-2 px-5 rounded-2xl hover:bg-terra-700 disabled:opacity-50"
      >
        {sending ? "..." : "Enviar"}
      </button>
    </form>
  );
}
