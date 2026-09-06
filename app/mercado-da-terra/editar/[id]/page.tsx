import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AdForm } from "@/components/mercado-da-terra/ad-form";
import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";

export default async function EditarAnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Buscar anúncio
  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", id)
    .eq("module", "mercado-da-terra")
    .single();

  if (error || !ad) {
    notFound();
  }

  // Verificar se é o autor
  if (ad.author_id !== user.id) {
    redirect("/mercado-da-terra");
  }

  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  // Buscar fotos existentes
  const { data: existingPhotos } = await supabase
    .from("marketplace_photos")
    .select("id, storage_path, sort_order")
    .eq("ad_id", ad.id)
    .order("sort_order");

  async function updateAd(formData: FormData) {
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
    const priceType = formData.get("priceType") as string;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    const seeking = formData.get("seeking") as string | null;
    const seekingDescription = formData.get("seeking_description") as string | null;
    // Campo próprio da Troca -- não confundir com "seeking" da Procura
    // (ver lib/mercado-da-terra/ad-types.ts).
    const wantsToReceive = formData.get("wantsToReceive") as string | null;
    const imageCount = parseInt(formData.get("image_count") as string) || 0;

    const details: Record<string, string> = {};
    if (seeking) details.seeking = seeking;
    if (seekingDescription) details.seeking_description = seekingDescription;
    if (wantsToReceive) details.wants_to_receive = wantsToReceive;

    // Atualizar anúncio
    const { error: updateError } = await supabase
      .from("marketplace_ads")
      .update({
        title,
        description,
        type,
        category_id: parseInt(categoryId),
        location,
        contact_method: contactMethod,
        price_type: priceType,
        price,
        details,
      })
      .eq("id", ad.id);

    if (updateError) {
      throw new Error("Erro ao atualizar: " + updateError.message);
    }

    // Upload de novas imagens
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

      await supabase
        .from("marketplace_photos")
        .insert({
          ad_id: ad.id,
          storage_path: photoUrl.publicUrl,
          sort_order: (existingPhotos?.length || 0) + i,
        });
    }

    redirect(`/mercado-da-terra/${ad.id}`);
  }

  return (
    <>
      <MarketplaceNavbar />
      <div className="min-h-screen bg-terra-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href={`/mercado-da-terra/${ad.id}`} className="text-terra-600 hover:text-terra-800">
              ← Voltar ao Anúncio
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-terra-900">Editar Anúncio</h1>
            <p className="text-terra-600 mt-2">{ad.title}</p>
          </div>

          <AdForm
            categories={categories || []}
            municipios={municipios || []}
            action={updateAd}
            inicial={{
              type: ad.type,
              title: ad.title,
              description: ad.description,
              category_id: ad.category_id,
              price_type: ad.price_type,
              price: ad.price,
              location: ad.location,
              contact_method: ad.contact_method,
              wantsToReceive: ad.details?.wants_to_receive ?? null,
            }}
            submitLabel="Guardar Alterações"
          />
        </main>
      </div>
    </>
  );
}
