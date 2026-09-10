"use client";

import { useState } from "react";
import { startConversation } from "@/app/viaturas/mensagens/actions";
import Link from "next/link";
import { LogIn, MessageCircle, Send, X } from "lucide-react";

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
      <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-extrabold text-white transition hover:bg-blue-500">
        <LogIn size={18} aria-hidden="true" /> Entrar para contactar
      </Link>
    );
  }

  if (currentUserId === sellerId) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-400"
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-extrabold text-white transition hover:bg-blue-500"
      >
        <MessageCircle size={18} aria-hidden="true" /> Contactar anunciante
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        Mensagem ao anunciante
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ex: Olá! Ainda está disponível?"
        required
        maxLength={2000}
        className="mb-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={sending}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <X size={16} aria-hidden="true" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          <Send size={16} aria-hidden="true" /> {sending ? "A enviar…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
