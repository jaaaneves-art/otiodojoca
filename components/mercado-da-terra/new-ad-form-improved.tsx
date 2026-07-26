"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, AlertCircle } from "lucide-react";

interface NewAdFormProps {
  adId?: number;
  initialData?: any;
}

const CATEGORIES = [
  "Produtos Agrícolas",
  "Animais e Pecuária",
  "Produtos Alimentares",
  "Artesanato Rural",
  "Maquinaria Agrícola",
  "Sementes e Mudas",
  "Experiências Rurais",
  "Outro",
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Produtos Agrícolas": ["Cereais", "Frutas", "Hortaliças", "Tubérculos", "Legumes"],
  "Animais e Pecuária": ["Bovinos", "Ovinos", "Caprinos", "Suínos", "Aves", "Apicultura"],
  "Produtos Alimentares": ["Lacticínios", "Carnes", "Embutidos", "Mel", "Azeite", "Conservas"],
  "Artesanato Rural": ["Cerâmica", "Tecelagem", "Madeira", "Joalharia", "Outro"],
  "Maquinaria Agrícola": ["Tratores", "Ferramentas", "Equipamento", "Peças"],
  "Sementes e Mudas": ["Sementes", "Mudas", "Fertilizantes", "Pesticidas"],
  "Experiências Rurais": ["Cursos", "Workshops", "Agriturismo", "Visitas"],
};

const DISTRICTS = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Covilhã",
  "Évora",
  "Faro",
  "Guarda",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Madeira",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
];

const PRICE_TYPES = [
  { value: "fixed", label: "Preço Fixo" },
  { value: "negotiable", label: "Negociável" },
  { value: "free", label: "Grátis" },
];

const CONTACT_METHODS = [
  { value: "message", label: "Mensagem Privada" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "in_person", label: "Presencialmente" },
];

export function NewAdForm({ adId, initialData }: NewAdFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    price: initialData?.price || "",
    priceType: initialData?.price_type || "fixed",
    municipality: initialData?.municipality || "",
    district: initialData?.district || "",
    location: initialData?.location || "",
    contactMethod: initialData?.contact_method || "message",
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro de validação do campo
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles: File[] = [];
    files.forEach((file) => {
      if (file.size > maxSize) {
        setError(`A imagem "${file.name}" é muito grande (máximo 5MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length + imagePreviews.length > 10) {
      setError("Máximo 10 imagens permitidas");
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    // Criar previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Título é obrigatório";
    if (!formData.description.trim()) errors.description = "Descrição é obrigatória";
    if (!formData.category) errors.category = "Categoria é obrigatória";
    if (!formData.district) errors.district = "Distrito é obrigatório";
    if (formData.priceType !== "free" && !formData.price) {
      errors.price = "Preço é obrigatório";
    }
    if (imagePreviews.length === 0) errors.images = "Adiciona pelo menos uma imagem";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Debes estar autenticado para publicar um anúncio");
      setLoading(false);
      return;
    }

    // TODO: Upload de imagens para Supabase Storage
    // TODO: Salvar dados do anúncio no banco de dados

    try {
      const adData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        price: formData.priceType === "free" ? null : parseFloat(formData.price),
        price_type: formData.priceType,
        municipality: formData.municipality,
        district: formData.district,
        location: formData.location,
        contact_method: formData.contactMethod,
        images: imagePreviews, // Será substituído pelos URLs reais
        status: "active",
      };

      if (adId) {
        // Editar anúncio existente
        const { error: updateError } = await supabase
          .from("marketplace_ads")
          .update(adData)
          .eq("id", adId);

        if (updateError) throw updateError;
      } else {
        // Criar novo anúncio
        const { data: newAd, error: insertError } = await supabase
          .from("marketplace_ads")
          .insert([adData])
          .select()
          .single();

        if (insertError) throw insertError;

        router.push(`/mercado-da-terra/${newAd.id}`);
        router.refresh();
        return;
      }

      router.refresh();
      setError(null);
      alert("Anúncio atualizado com sucesso!");
    } catch (err) {
      setError("Erro ao publicar anúncio. Tenta novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{adId ? "Editar Anúncio" : "Novo Anúncio"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alertas */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Seção 1: Informação Básica */}
          <div className="border-b border-terra-200 pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Informação Básica</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-terra-700">Título *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Batatas biológicas de produção própria"
                  className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-terra-700">Descrição *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Descreve o produto em detalhe (origem, qualidade, disponibilidade, etc.)"
                  className={`w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400 ${
                    validationErrors.description ? "border-red-500" : "border-terra-200"
                  }`}
                />
                {validationErrors.description && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Categorias */}
          <div className="border-b border-terra-200 pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Categorias</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-terra-700">Categoria *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded-lg border text-sm ${
                    validationErrors.category ? "border-red-500" : "border-terra-200"
                  }`}
                >
                  <option value="">Seleciona uma categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.category}</p>
                )}
              </div>

              {formData.category && (
                <div>
                  <label className="text-sm font-medium text-terra-700">Subcategoria</label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg border border-terra-200 text-sm"
                  >
                    <option value="">Opcional</option>
                    {SUBCATEGORIES[formData.category]?.map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Preço */}
          <div className="border-b border-terra-200 pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Preço</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-terra-700">Tipo de Preço *</label>
                <select
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-lg border border-terra-200 text-sm"
                >
                  {PRICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.priceType !== "free" && (
                <div>
                  <label className="text-sm font-medium text-terra-700">Preço (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={validationErrors.price ? "border-red-500" : ""}
                  />
                  {validationErrors.price && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seção 4: Localização */}
          <div className="border-b border-terra-200 pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Localização</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-terra-700">Distrito *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded-lg border text-sm ${
                    validationErrors.district ? "border-red-500" : "border-terra-200"
                  }`}
                >
                  <option value="">Seleciona um distrito</option>
                  {DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                {validationErrors.district && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.district}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-terra-700">Concelho/Freguesia</label>
                <Input
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  placeholder="Ex: Vila Real"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-terra-700">Localização Específica</label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Complementa a localização (rua, ponto de referência, etc.)"
                />
              </div>
            </div>
          </div>

          {/* Seção 5: Contacto */}
          <div className="border-b border-terra-200 pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Método de Contacto</h3>

            <div>
              <label className="text-sm font-medium text-terra-700">Preferência de Contacto</label>
              <select
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleInputChange}
                className="w-full mt-2 p-2 rounded-lg border border-terra-200 text-sm"
              >
                {CONTACT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção 6: Imagens */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-terra-900 mb-4">Imagens *</h3>

            {/* Upload area */}
            <div className="mb-4 p-8 border-2 border-dashed border-terra-300 rounded-lg hover:border-terra-500 transition cursor-pointer">
              <label htmlFor="image-input" className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="text-terra-500" size={32} />
                <div className="text-center">
                  <p className="font-semibold text-terra-700">Adiciona imagens</p>
                  <p className="text-sm text-terra-600">Clica para selecionar ou arrasta ficheiros aqui</p>
                  <p className="text-xs text-terra-500 mt-1">Máximo 10 imagens, 5MB cada</p>
                </div>
              </label>
              <input
                id="image-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {validationErrors.images && (
              <p className="text-xs text-red-600 mb-2">{validationErrors.images}</p>
            )}

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${idx}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Capa
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-6 border-t border-terra-200">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-terra-600 hover:bg-terra-700 text-white"
              size="lg"
            >
              {loading
                ? adId
                  ? "A atualizar..."
                  : "A publicar..."
                : adId
                ? "Atualizar Anúncio"
                : "Publicar Anúncio"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              size="lg"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
