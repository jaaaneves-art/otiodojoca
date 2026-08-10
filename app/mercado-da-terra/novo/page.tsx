import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdForm } from "@/components/mercado-da-terra/ad-form";
import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";

async function createAd(formData: FormData) {
  "use server";

  const supabase = createClient();
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
  const imageCount = parseInt(formData.get("image_count") as string) || 0;

  const details = (seeking || seekingDescription) 
    ? { seeking: seeking || "", seeking_description: seekingDescription || "" }
    : {};

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .insert({
      author_id: user.id,
      title,
      description,
      type,
      category_id: parseInt(categoryId),
      location,
      contact_method: contactMethod,
      price_type: priceType,
      price,
      status: "active",
      details: details,
    })
    .select("id")
    .single();

  if (adError || !ad) {
    throw new Error("Erro ao criar anúncio: " + adError?.message);
  }

  console.log(`✅ Anúncio ${ad.id} criado`);

  for (let i = 0; i < imageCount; i++) {
    const file = formData.get(`image_${i}`) as File;
    if (!file) continue;

    console.log(`📤 Upload imagem ${i + 1}/${imageCount}: ${file.name}`);

    const fileName = `${ad.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from("marketplace-photos")
      .upload(fileName, file);

    if (uploadError) {
      console.error(`❌ Erro upload:`, uploadError);
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
        sort_order: i,
      });

    console.log(`✅ Foto ${i + 1} OK`);
  }

  redirect(`/mercado-da-terra/${ad.id}`);
}

export default async function NovoAnuncioPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  return (
    <>
      <MarketplaceNavbar />
      <div className="min-h-screen bg-terra-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
              ← Voltar ao Mercado
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-terra-900">Novo Anúncio</h1>
            <p className="text-terra-600 mt-2">Publica um novo produto, serviço ou oferta</p>
          </div>

          <AdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createAd}
            submitLabel="Publicar Anúncio"
          />
        </main>
      </div>
    </>
  );
}
