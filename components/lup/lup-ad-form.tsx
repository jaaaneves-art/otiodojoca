"use client";

import { useState } from "react";
import ImageUpload from "@/components/mercado-da-terra/image-upload";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { LUP_AD_TYPES, getLupAdType } from "@/lib/lup/ad-types";

interface Categoria { id: number; name: string; }
interface Municipio { nome: string; distrito_regiao: string; }

interface AdInicial {
  type?: string;
  title?: string;
  description?: string;
  category_id?: number | null;
  price?: number | null;
  location?: string | null;
  contact_method?: string;
  quantity?: string;
  unit?: string;
  kg_estimate?: string;
  /** ISO (UTC) — vem diretamente da coluna details (guardado como string ISO) */
  pickup_starts_at?: string | null;
  /** ISO (UTC) — idem */
  pickup_ends_at?: string | null;
}

// Mesmo cuidado do bazar-ad-form.tsx com <input type="datetime-local">: a
// conversão para/de ISO tem sempre de passar pelos getters *locais* do
// Date, nunca por slicing de string nem getters UTC, para não desalinhar
// a hora mostrada/submetida do fuso do utilizador. Só pode acontecer no
// browser.
function isoParaDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalParaIso(valor: string): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function LupAdForm({
  categories,
  municipios,
  action,
  inicial,
  submitLabel = "Publicar",
}: {
  categories: Categoria[];
  municipios: Municipio[];
  action: (formData: FormData) => void | Promise<void>;
  inicial?: AdInicial;
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState(inicial?.type ?? "oferta");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const config = getLupAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const inicioRaw = formData.get("pickupStartsAt") as string;
    const fimRaw = formData.get("pickupEndsAt") as string;
    formData.set("pickupStartsAt", inicioRaw ? datetimeLocalParaIso(inicioRaw) : "");
    formData.set("pickupEndsAt", fimRaw ? datetimeLocalParaIso(fimRaw) : "");

    uploadedFiles.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    formData.append("image_count", uploadedFiles.length.toString());

    await action(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-lup-200 space-y-4">
      <div>
        <label className="text-sm font-medium">O que queres fazer? *</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {Object.values(LUP_AD_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setTipo(type.id)}
              className={`py-2 px-3 rounded-lg border font-medium text-sm transition ${
                tipo === type.id
                  ? "bg-lup-500 border-lup-500 text-white"
                  : "border-lup-200 text-lup-800 hover:bg-lup-50"
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={tipo} />
      </div>

      <div>
        <label className="text-sm font-medium">Título *</label>
        <input
          name="title"
          defaultValue={inicial?.title ?? ""}
          placeholder="Ex: Caixa surpresa de padaria"
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
          placeholder="Descreve o que estás a oferecer, vender ou procurar..."
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Ciclo *</label>
        <select
          name="categoryId"
          defaultValue={inicial?.category_id ?? ""}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          <option value="">Seleciona um ciclo</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {mostra("price") && (
        <div>
          <label className="text-sm font-medium">Preço simbólico (EUR) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.price ?? ""}
            placeholder="0.00"
            required
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      )}

      {mostra("quantity") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Quantidade *</label>
            <input
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              defaultValue={inicial?.quantity ?? ""}
              placeholder="Ex: 5"
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Unidade *</label>
            <input
              name="unit"
              defaultValue={inicial?.unit ?? ""}
              placeholder="Ex: caixas, kg, sacos"
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      )}

      {mostra("kgEstimate") && (
        <div>
          <label className="text-sm font-medium">Peso aproximado (kg)</label>
          <input
            name="kgEstimate"
            type="number"
            step="0.1"
            min="0"
            defaultValue={inicial?.kg_estimate ?? ""}
            placeholder="Opcional — usado só para estimar o impacto"
            className="w-full border rounded-lg p-2 mt-1"
          />
          <p className="text-xs text-lup-600 mt-1">Ajuda a mostrar quanto CO₂ este anúncio ajuda a evitar (estimativa)</p>
        </div>
      )}

      {mostra("pickupStartsAt") && (
        <div className="bg-lup-50 border border-lup-200 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-lup-900">⏰ Janela de recolha</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Disponível a partir de</label>
              <input
                name="pickupStartsAt"
                type="datetime-local"
                defaultValue={isoParaDatetimeLocal(inicial?.pickup_starts_at)}
                className="w-full border rounded-lg p-2 mt-1"
              />
              <p className="text-xs text-lup-600 mt-1">Deixa em branco para já estar disponível</p>
            </div>
            <div>
              <label className="text-sm font-medium">Recolher até *</label>
              <input
                name="pickupEndsAt"
                type="datetime-local"
                defaultValue={isoParaDatetimeLocal(inicial?.pickup_ends_at)}
                required
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>
        </div>
      )}

      <MunicipioAutocomplete municipios={municipios} valorInicial={inicial?.location ?? ""} />

      <ImageUpload onFilesSelected={handleFilesSelected} maxFiles={5} maxSizeMB={5} />

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
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-lup-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-lup-600"
      >
        {submitLabel}
      </button>
    </form>
  );
}
