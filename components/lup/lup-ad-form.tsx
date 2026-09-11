"use client";

import { useState } from "react";
import ImageUpload from "@/components/mercado-da-terra/image-upload";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { LUP_AD_TYPES, getLupAdType } from "@/lib/lup/ad-types";
import { Clock3, Contact, FileText, ImagePlus, Layers3, LoaderCircle, Package2, Send, Sparkles, Tag } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const config = getLupAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
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
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-lup-200 bg-lup-50/40 px-3.5 text-lup-950 outline-none transition placeholder:text-lup-700/45 focus:border-lup-500 focus:bg-white focus:ring-4 focus:ring-lup-100";
  const labelClass = "flex items-center gap-2 text-sm font-extrabold text-lup-950";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-lup-200/90 bg-white p-5 shadow-[0_20px_55px_rgba(15,74,44,0.08)] sm:p-8">
      <section className="rounded-2xl border border-lup-200 bg-lup-50/60 p-4 sm:p-5">
        <label className={labelClass}><Layers3 className="h-4 w-4 text-lup-600" /> O que queres fazer? *</label>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.values(LUP_AD_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setTipo(type.id)}
              className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-extrabold transition ${
                tipo === type.id
                  ? "border-lup-700 bg-lup-700 text-white shadow-md shadow-lup-800/10"
                  : "border-lup-200 bg-white text-lup-800 hover:border-lup-400 hover:bg-lup-50"
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={tipo} />
      </section>

      <div>
        <label className={labelClass}><Tag className="h-4 w-4 text-lup-600" /> Título *</label>
        <input
          name="title"
          defaultValue={inicial?.title ?? ""}
          placeholder="Ex: Caixa surpresa de padaria"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}><FileText className="h-4 w-4 text-lup-600" /> Descrição *</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={inicial?.description ?? ""}
          placeholder="Descreve o que estás a oferecer, vender ou procurar..."
          required
          className={`${fieldClass} min-h-32 py-3`}
        />
      </div>

      <div>
        <label className={labelClass}><Sparkles className="h-4 w-4 text-lup-600" /> Ciclo *</label>
        <select
          name="categoryId"
          defaultValue={inicial?.category_id ?? ""}
          required
          className={fieldClass}
        >
          <option value="">Seleciona um ciclo</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {mostra("price") && (
        <div>
          <label className={labelClass}>Preço simbólico (EUR) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.price ?? ""}
            placeholder="0.00"
            required
            className={fieldClass}
          />
        </div>
      )}

      {mostra("quantity") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}><Package2 className="h-4 w-4 text-lup-600" /> Quantidade *</label>
            <input
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              defaultValue={inicial?.quantity ?? ""}
              placeholder="Ex: 5"
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Unidade *</label>
            <input
              name="unit"
              defaultValue={inicial?.unit ?? ""}
              placeholder="Ex: caixas, kg, sacos"
              required
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {mostra("kgEstimate") && (
        <div>
          <label className={labelClass}>Peso aproximado (kg)</label>
          <input
            name="kgEstimate"
            type="number"
            step="0.1"
            min="0"
            defaultValue={inicial?.kg_estimate ?? ""}
            placeholder="Opcional — usado só para estimar o impacto"
            className={fieldClass}
          />
          <p className="text-xs text-lup-600 mt-1">Ajuda a mostrar quanto CO₂ este anúncio ajuda a evitar (estimativa)</p>
        </div>
      )}

      {mostra("pickupStartsAt") && (
        <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-amber-950"><Clock3 className="h-4 w-4" /> Janela de recolha</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-amber-950">Disponível a partir de</label>
              <input
                name="pickupStartsAt"
                type="datetime-local"
                defaultValue={isoParaDatetimeLocal(inicial?.pickup_starts_at)}
                className={fieldClass}
              />
              <p className="text-xs text-lup-600 mt-1">Deixa em branco para já estar disponível</p>
            </div>
            <div>
              <label className="text-sm font-bold text-amber-950">Recolher até *</label>
              <input
                name="pickupEndsAt"
                type="datetime-local"
                defaultValue={isoParaDatetimeLocal(inicial?.pickup_ends_at)}
                required
                className={fieldClass}
              />
            </div>
          </div>
        </section>
      )}

      <MunicipioAutocomplete municipios={municipios} valorInicial={inicial?.location ?? ""} />

      <section className="rounded-2xl border border-dashed border-lup-300 bg-lup-50/40 p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-lup-950"><ImagePlus className="h-4 w-4 text-lup-600" /> Fotografias</p>
        <ImageUpload onFilesSelected={handleFilesSelected} maxFiles={5} maxSizeMB={5} />
      </section>

      <div>
        <label className={labelClass}><Contact className="h-4 w-4 text-lup-600" /> Contacto *</label>
        <select
          name="contactMethod"
          defaultValue={inicial?.contact_method ?? "message"}
          required
          className={fieldClass}
        >
          <option value="message">Mensagem</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lup-700 px-5 py-3 text-base font-black text-white shadow-xl shadow-lup-800/15 transition hover:-translate-y-0.5 hover:bg-lup-800 disabled:cursor-wait disabled:opacity-65"
      >
        {submitting ? <><LoaderCircle className="h-5 w-5 animate-spin" /> A guardar…</> : <><Send className="h-5 w-5" /> {submitLabel}</>}
      </button>
    </form>
  );
}
