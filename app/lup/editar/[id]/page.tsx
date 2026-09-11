import { createClient } from "@/lib/supabase/server";
import {
  IMAGEM_MAX_FICHEIROS,
  extensaoParaImagem,
  validarImagem,
} from "@/lib/uploads/validar-imagem";
import { redirect, notFound } from "next/navigation";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";
import { PencilLine } from "lucide-react";
import { LupBackLink, LupPageHeader, lupPageClass } from "@/components/lup/lup-ui";

export default async function EditarAnuncioLupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", id)
    .eq("module", "lup")
    .single();

  if (error || !ad) {
    notFound();
  }

  if (ad.author_id !== user.id) {
    redirect("/lup");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "lup")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  async function updateLupAd(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Não autenticado");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const categoryId = formData.get("categoryId") as string;
    const location = formData.get("location") as string;
    const contactMethod = formData.get("contactMethod") as string;
    // "image_count" continua a vir do cliente, mas é só um limite
    // superior do ciclo abaixo -- nunca é gravado nem confiado sem mais.
    // Cada ficheiro é lido e validado individualmente antes de qualquer
    // upload (ver lib/uploads/validar-imagem.ts).
    const imageCountBruto = parseInt(formData.get("image_count") as string) || 0;
    const imageCount = Math.min(Math.max(imageCountBruto, 0), IMAGEM_MAX_FICHEIROS);

    let price: number | null = null;
    if (type === "venda") {
      price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    }

    const details: Record<string, string> = {};
    if (type === "oferta" || type === "venda") {
      const quantity = formData.get("quantity") as string;
      const unit = formData.get("unit") as string;
      const kgEstimate = formData.get("kgEstimate") as string;
      const pickupStartsAt = formData.get("pickupStartsAt") as string;
      const pickupEndsAt = formData.get("pickupEndsAt") as string;

      if (!quantity || !unit || !pickupEndsAt) {
        throw new Error("Quantidade, unidade e prazo de recolha são obrigatórios");
      }

      details.quantity = quantity;
      details.unit = unit;
      if (kgEstimate) details.kg_estimate = kgEstimate;
      if (pickupStartsAt) details.pickup_starts_at = pickupStartsAt;
      details.pickup_ends_at = pickupEndsAt;
    }

    const { error: updateError } = await supabase
      .from("marketplace_ads")
      .update({
        title,
        description,
        type,
        category_id: parseInt(categoryId),
        location,
        contact_method: contactMethod,
        price_type: type === "oferta" ? "free" : type === "venda" ? "fixed" : null,
        price,
        details,
      })
      .eq("id", ad.id)
      .eq("module", "lup");

    if (updateError) {
      throw new Error("Erro ao atualizar: " + updateError.message);
    }

    const ficheiros: File[] = [];
    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      if (!file) continue;
      const erro = await validarImagem(file);
      if (erro) {
        throw new Error(`Imagem ${i + 1}: ${erro}`);
      }
      ficheiros.push(file);
    }

    for (let i = 0; i < ficheiros.length; i++) {
      const file = ficheiros[i];

      const fileName = `${ad.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extensaoParaImagem(file.type)}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace-photos")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Erro ao upload:", uploadError);
        continue;
      }

      const { data: photoUrl } = supabase.storage
        .from("marketplace-photos")
        .getPublicUrl(fileName);

      await supabase.from("marketplace_photos").insert({
        ad_id: ad.id,
        storage_path: photoUrl.publicUrl,
        sort_order: i,
      });
    }

    redirect(`/lup/${ad.id}`);
  }

  return (
    <>
      <LupNavbar />
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
          <LupBackLink href={`/lup/${ad.id}`}>Voltar ao anúncio</LupBackLink>
          <LupPageHeader eyebrow="Gestão do anúncio" title="Editar anúncio" description={ad.title} icon={PencilLine} />

          <LupAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={updateLupAd}
            inicial={{
              type: ad.type,
              title: ad.title,
              description: ad.description,
              category_id: ad.category_id,
              price: ad.price,
              location: ad.location,
              contact_method: ad.contact_method,
              quantity: ad.details?.quantity,
              unit: ad.details?.unit,
              kg_estimate: ad.details?.kg_estimate,
              pickup_starts_at: ad.details?.pickup_starts_at,
              pickup_ends_at: ad.details?.pickup_ends_at,
            }}
            submitLabel="Guardar Alterações"
          />
        </main>
      </div>
    </>
  );
}
