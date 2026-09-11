import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";
import { PlusCircle } from "lucide-react";
import { LupBackLink, LupPageHeader, lupPageClass } from "@/components/lup/lup-ui";

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
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
          <LupBackLink href="/lup">Voltar ao LUP</LupBackLink>
          <LupPageHeader eyebrow="Novo ciclo" title="Publicar no LUP" description="Doa, vende a preço simbólico ou pede excedentes. Leva apenas alguns minutos." icon={PlusCircle} />

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
