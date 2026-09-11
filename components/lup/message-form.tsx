"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/lup/mensagens/actions";
import { LoaderCircle, Send } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Escreve uma mensagem..."
        aria-label="Mensagem"
        className="min-h-12 flex-1 resize-none rounded-xl border border-lup-200 bg-lup-50/50 p-3 text-lup-950 outline-none transition placeholder:text-lup-700/50 focus:border-lup-500 focus:bg-white focus:ring-4 focus:ring-lup-100"
      />
      <button
        type="submit"
        disabled={sending || !content.trim()}
        aria-label="Enviar mensagem"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lup-700 text-white shadow-lg shadow-lup-800/15 transition hover:bg-lup-800 disabled:opacity-50 sm:flex sm:w-auto sm:px-5"
      >
        {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        <span className="hidden font-bold sm:inline">Enviar</span>
      </button>
    </form>
  );
}
