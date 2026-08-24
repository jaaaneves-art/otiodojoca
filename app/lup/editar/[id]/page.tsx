import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";

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
    const imageCount = parseInt(formData.get("image_count") as string) || 0;

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

    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`) as File;
      if (!file) continue;

      const fileName = `${ad.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

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
      <div className="min-h-screen bg-lup-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href={`/lup/${ad.id}`} className="text-lup-700 hover:text-lup-900">
              ← Voltar ao Anúncio
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-lup-900">Editar Anúncio</h1>
            <p className="text-lup-700 mt-2">{ad.title}</p>
          </div>

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
