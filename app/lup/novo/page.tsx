import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";

async function createLupAd(formData: FormData) {
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
  // "procura" não tem quantidade/prazo próprios — o título/descrição já dizem o que se procura.

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .insert({
      author_id: user.id,
      module: "lup",
      title,
      description,
      type,
      category_id: parseInt(categoryId),
      location,
      contact_method: contactMethod,
      price_type: type === "oferta" ? "free" : type === "venda" ? "fixed" : null,
      price,
      status: "active",
      details,
    })
    .select("id")
    .single();

  if (adError || !ad) {
    throw new Error("Erro ao publicar: " + adError?.message);
  }

  for (let i = 0; i < imageCount; i++) {
    const file = formData.get(`image_${i}`) as File;
    if (!file) continue;

    const fileName = `${ad.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("marketplace-photos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Erro upload:", uploadError);
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

export default async function NovoAnuncioLupPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
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

  return (
    <>
      <LupNavbar />
      <div className="min-h-screen bg-lup-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/lup" className="text-lup-700 hover:text-lup-900">
              ← Voltar ao Lup
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-lup-900">Publicar no Lup</h1>
            <p className="text-lup-700 mt-2">Doa, vende a preço simbólico ou pede excedentes — para pessoas, animais ou compostagem</p>
          </div>

          <LupAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createLupAd}
            submitLabel="Publicar"
          />
        </main>
      </div>
    </>
  );
}
