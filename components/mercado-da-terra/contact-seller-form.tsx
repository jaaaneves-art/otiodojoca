"use client";

import { useState } from "react";
import { startConversation } from "@/app/mercado-da-terra/messages/actions";

interface ContactSellerFormProps {
  adId: number;
  sellerId: string;
  currentUserId?: string;
}

export default function ContactSellerForm({ adId, sellerId, currentUserId }: ContactSellerFormProps) {
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  // Se não estiver logado
  if (!currentUserId) {
    return (
      <a href="/login" className="flex-1">
        <button className="w-full bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700">
          💬 Entrar para Enviar Mensagem
        </button>
      </a>
    );
  }

  // Se for o próprio autor
  if (currentUserId === sellerId) {
    return (
      <button
        disabled
        className="flex-1 bg-terra-100 text-terra-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
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
        className="flex-1 bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700"
      >
        💬 Enviar Mensagem
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-terra-50 p-4 rounded-lg border border-terra-200">
      <label className="text-sm font-medium text-terra-800 block mb-2">
        Envia uma mensagem ao vendedor:
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ex: Olá! Ainda está disponível?"
        required
        className="w-full border border-terra-200 rounded-lg p-2 focus:outline-none focus:border-terra-600 mb-3"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={sending}
          className="flex-1 border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="flex-1 bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700 disabled:opacity-50"
        >
          {sending ? "A enviar..." : "✉️ Enviar"}
        </button>
      </div>
    </form>
  );
}
