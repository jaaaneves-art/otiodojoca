"use client";

import { useState } from "react";
import { startConversation } from "@/app/imoveis/mensagens/actions";

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
      <a href="/login" className="flex-1">
        <button className="w-full bg-imoveis-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-imoveis-700">
          💬 Entrar para Enviar Mensagem
        </button>
      </a>
    );
  }

  if (currentUserId === sellerId) {
    return (
      <button
        disabled
        className="flex-1 bg-imoveis-100 text-imoveis-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
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
        className="flex-1 bg-imoveis-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-imoveis-700"
      >
        💬 Enviar Mensagem
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-imoveis-50 p-4 rounded-lg border border-imoveis-200">
      <label className="text-sm font-medium text-imoveis-800 block mb-2">
        Envia uma mensagem ao anunciante:
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ex: Olá! O imóvel ainda está disponível?"
        required
        className="w-full border border-imoveis-200 rounded-lg p-2 focus:outline-none focus:border-imoveis-600 mb-3"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={sending}
          className="flex-1 border border-imoveis-200 text-imoveis-700 font-medium py-2 px-4 rounded-lg hover:bg-imoveis-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="flex-1 bg-imoveis-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-imoveis-700 disabled:opacity-50"
        >
          {sending ? "A enviar..." : "✉️ Enviar"}
        </button>
      </div>
    </form>
  );
}
