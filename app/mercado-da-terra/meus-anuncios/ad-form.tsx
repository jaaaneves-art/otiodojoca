"use client";

import { useState } from "react";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { AD_TYPES, getAdType } from "@/lib/mercado-da-terra/ad-types";

interface Categoria { id: number; name: string; }
interface Municipio { nome: string; distrito_regiao: string; }

interface AdInicial {
  type?: string;
  title?: string;
  description?: string;
  category_id?: number | null;
  price_type?: string;
  price?: number | null;
  location?: string | null;
  contact_method?: string;
}

export function AdForm({
  categories,
  municipios,
  action,
  inicial,
  submitLabel = "Publicar Anúncio",
}: {
  categories: Categoria[];
  municipios: Municipio[];
  action: (formData: FormData) => void | Promise<void>;
  inicial?: AdInicial;
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState(inicial?.type ?? "sale");
  const config = getAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);

  return (
    <form action={action} className="bg-white p-6 rounded-lg border border-terra-200 space-y-4">
      <div>
        <label className="text-sm font-medium">Tipo de Anúncio *</label>
        <select
          name="type"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          {Object.values(AD_TYPES).map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Título *</label>
        <input name="title" defaultValue={inicial?.title ?? ""} placeholder="Ex: Batatas caseiras" required className="w-full border rounded-lg p-2 mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea name="description" rows={4} defaultValue={inicial?.description ?? ""} placeholder="Descreve o produto..." required className="w-full border rounded-lg p-2 mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Categoria *</label>
          <select name="categoryId" defaultValue={inicial?.category_id ?? ""} required className="w-full border rounded-lg p-2 mt-1">
            <option value="">Seleciona</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {mostra("priceType") && (
          <div>
            <label className="text-sm font-medium">Tipo de Preco *</label>
            <select name="priceType" defaultValue={inicial?.price_type ?? "fixed"} className="w-full border rounded-lg p-2 mt-1">
              <option value="fixed">Preco Fixo</option>
              <option value="negotiable">Negociavel</option>
              <option value="free">Gratis</option>
            </select>
          </div>
        )}
      </div>

      {mostra("price") && (
        <div>
          <label className="text-sm font-medium">Preco (EUR)</label>
          <input type="number" step="0.01" name="price" defaultValue={inicial?.price ?? ""} placeholder="0.00" className="w-full border rounded-lg p-2 mt-1" />
        </div>
      )}

      <MunicipioAutocomplete municipios={municipios} valorInicial={inicial?.location ?? ""} />

      {mostra("wantsToReceive") && (
        <div>
          <label className="text-sm font-medium">O que Preciso *</label>
          <textarea name="wantsToReceive" rows={3} placeholder="Descreve o que pretendes receber em troca..." className="w-full border rounded-lg p-2 mt-1" />
        </div>
      )}

      {mostra("seeking") && (
        <div>
          <label className="text-sm font-medium">Meu Orçamento *</label>
          <textarea name="seeking" rows={3} placeholder="Descreve o teu orçamento..." className="w-full border rounded-lg p-2 mt-1" />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Contacto *</label>
        <select name="contactMethod" defaultValue={inicial?.contact_method ?? "message"} required className="w-full border rounded-lg p-2 mt-1">
          <option value="message">Mensagem</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
        </select>
      </div>

      <button type="submit" className="w-full bg-terra-600 text-white font-medium py-2 rounded-lg hover:bg-terra-700">
        {submitLabel}
      </button>
    </form>
  );
}

