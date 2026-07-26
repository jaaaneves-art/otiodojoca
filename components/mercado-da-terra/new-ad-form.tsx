"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewAdForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("fixed");
  const [location, setLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("message");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: ad, error: adError } = await supabase
      .from("marketplace_ads")
      .insert({
        title,
        description,
        price: price ? parseFloat(price) : null,
        price_type: priceType,
        location,
        contact_method: contactMethod,
      })
      .select()
      .single();

    setLoading(false);

    if (adError || !ad) {
      setError("Erro ao criar anuncio. Tenta novamente.");
    } else {
      router.push(`/mercado-da-terra/${ad.id}`);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Anuncio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Titulo</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Batatas caseiras"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreve o produto..."
              className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preco (€)</label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de preco</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full h-10 rounded-lg border border-terra-200 px-3 text-sm"
              >
                <option value="fixed">Fixo</option>
                <option value="negotiable">Negociavel</option>
                <option value="free">Gratis</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Localizacao</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Concelho ou freguesia"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Metodo de contacto</label>
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="w-full h-10 rounded-lg border border-terra-200 px-3 text-sm"
            >
              <option value="message">Mensagem privada</option>
              <option value="phone">Telefone</option>
              <option value="email">Email</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "A publicar..." : "Publicar anuncio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
