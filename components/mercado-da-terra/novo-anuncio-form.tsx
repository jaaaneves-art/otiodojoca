"use client";

import { useState } from "react";

export function NovoAnuncioForm({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(Object.fromEntries(formData));
    } catch (err) {
      setError("Erro ao publicar anúncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-terra-200 space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Título *</label>
        <input name="title" placeholder="Ex: Batatas caseiras" required className="w-full border rounded-lg p-2 mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea
          name="description"
          rows={4}
          placeholder="Descreve o produto..."
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Categoria *</label>
          <select name="category" required className="w-full border rounded-lg p-2 mt-1">
            <option value="">Seleciona</option>
            <option value="Produtos Agrícolas">Produtos Agrícolas</option>
            <option value="Animais e Pecuária">Animais e Pecuária</option>
            <option value="Produtos Alimentares">Produtos Alimentares</option>
            <option value="Artesanato Rural">Artesanato Rural</option>
            <option value="Maquinaria Agrícola">Maquinaria Agrícola</option>
            <option value="Sementes e Mudas">Sementes e Mudas</option>
            <option value="Experiências Rurais">Experiências Rurais</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Tipo de Preço *</label>
          <select name="priceType" defaultValue="fixed" className="w-full border rounded-lg p-2 mt-1">
            <option value="fixed">Preço Fixo</option>
            <option value="negotiable">Negociável</option>
            <option value="free">Grátis</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Preço (€)</label>
        <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full border rounded-lg p-2 mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Concelho *</label>
        <input name="municipality" placeholder="Ex: Aveiro" required className="w-full border rounded-lg p-2 mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Contacto *</label>
        <select name="contactMethod" required className="w-full border rounded-lg p-2 mt-1">
          <option value="message">Mensagem</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-terra-600 text-white font-medium py-2 rounded-lg hover:bg-terra-700 disabled:opacity-50">
        {loading ? "A publicar..." : "Publicar Anúncio"}
      </button>
    </form>
  );
}