"use client";

import { useState } from "react";
import ImageUpload from "@/components/mercado-da-terra/image-upload";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { AD_TYPES, getAdType } from "@/lib/mercado-da-terra/ad-types";

interface Categoria { id: number; name: string; }
interface Municipio { nome: string; distrito_regiao: string; }

interface ExistingPhoto {
  id: number;
  storage_path: string;
  sort_order: number;
}

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
  existingPhotos = [],
  submitLabel = "Publicar Anúncio",
}: {
  categories: Categoria[];
  municipios: Municipio[];
  action: (formData: FormData) => void | Promise<void>;
  inicial?: AdInicial;
  existingPhotos?: ExistingPhoto[];
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState(inicial?.type ?? "sale");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const config = getAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleExistingRemoved = (removedIds: number[]) => {
    setRemovedPhotoIds(removedIds);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    // Anexar ficheiros novos ao FormData
    uploadedFiles.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    formData.append("image_count", uploadedFiles.length.toString());

    // Anexar IDs de imagens a remover
    formData.append("removed_photo_ids", JSON.stringify(removedPhotoIds));

    await action(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-terra-200 space-y-4">
      <div>
        <label className="text-sm font-medium">Tipo de Anúncio *</label>
        <select
          name="type"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          {Object.values(AD_TYPES).map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Titulo *</label>
        <input
          name="title"
          defaultValue={inicial?.title ?? ""}
          placeholder="Ex: Batatas caseiras"
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={inicial?.description ?? ""}
          placeholder="Descreve o produto..."
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Categoria *</label>
          <select
            name="categoryId"
            defaultValue={inicial?.category_id ?? ""}
            required
            className="w-full border rounded-lg p-2 mt-1"
          >
            <option value="">Seleciona uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {mostra("priceType") && (
          <div>
            <label className="text-sm font-medium">Tipo de Preço *</label>
            <select
              name="priceType"
              defaultValue={inicial?.price_type ?? "fixed"}
              required
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="fixed">Preço Fixo</option>
              <option value="negotiable">Negociável</option>
              <option value="free">Grátis</option>
            </select>
          </div>
        )}
      </div>

      {mostra("price") && (
        <div>
          <label className="text-sm font-medium">Preço (EUR) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={inicial?.price ?? ""}
            placeholder="0.00"
            required
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      )}

      <MunicipioAutocomplete municipios={municipios} valorInicial={inicial?.location ?? ""} />

      {/* Upload de Imagens */}
      <ImageUpload
        onFilesSelected={handleFilesSelected}
        onExistingRemoved={handleExistingRemoved}
        existingPhotos={existingPhotos}
        maxFiles={5}
        maxSizeMB={5}
      />

      {mostra("seeking") && (
        <div>
          <label className="text-sm font-medium">O que Procuro *</label>
          <input
            name="seeking"
            defaultValue={inicial?.title ?? ""}
            placeholder="Ex: Milho"
            required
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      )}

      {mostra("seeking_description") && (
        <div>
          <label className="text-sm font-medium">Descrição do que Procuro *</label>
          <textarea
            name="seeking_description"
            rows={3}
            placeholder="Descreve o que procuras..."
            required
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Contacto *</label>
        <select
          name="contactMethod"
          defaultValue={inicial?.contact_method ?? "message"}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          <option value="message">Mensagem</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
          <option value="in-person">Presencial</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
