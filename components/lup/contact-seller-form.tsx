"use client";

import { useState } from "react";
import { startConversation } from "@/app/lup/mensagens/actions";
import { LoaderCircle, LogIn, MessageCircle, Send } from "lucide-react";

interface ContactSellerFormProps {
  adId: number;
  sellerId: string;
  currentUserId?: string;
}

export default function ContactSellerForm({ adId, sellerId, currentUserId }: ContactSellerFormProps) {
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  if (!currentUserId) {
    return (
      <a href="/login" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-lup-700 px-4 py-3 font-bold text-white transition hover:bg-lup-800">
        <LogIn className="h-5 w-5" /> Entrar para enviar mensagem
      </a>
    );
  }

  if (currentUserId === sellerId) {
    return (
      <button
        disabled
        className="min-h-12 flex-1 cursor-not-allowed rounded-xl bg-lup-100 px-4 py-3 font-bold text-lup-500"
      >
        Este é o teu anúncio
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    const formData = new FormData();
    formData.append("adId", adId.toString());
    formData.append("content", content);

    try {
      await startConversation(formData);
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-lup-700 px-4 py-3 font-bold text-white transition hover:bg-lup-800"
      >
        <MessageCircle className="h-5 w-5" /> Enviar mensagem
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-lup-200 bg-lup-50 p-4">
      <label className="text-sm font-medium text-lup-800 block mb-2">
        Envia uma mensagem ao anunciante:
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ex: Olá! Ainda está disponível para recolha?"
        required
        className="mb-3 w-full rounded-xl border border-lup-200 bg-white p-3 outline-none focus:border-lup-500 focus:ring-4 focus:ring-lup-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={sending}
          className="min-h-11 flex-1 rounded-xl border border-lup-200 px-4 py-2 font-bold text-lup-700 hover:bg-lup-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-lup-700 px-4 py-2 font-bold text-white hover:bg-lup-800 disabled:opacity-50"
        >
          {sending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> A enviar…</> : <><Send className="h-4 w-4" /> Enviar</>}
        </button>
      </div>
    </form>
  );
}
