import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImovelAdForm } from "@/components/imoveis/imoveis-ad-form";
import ImoveisNavbar from "@/components/imoveis/imoveis-navbar";
import { buildImovelDetails } from "@/lib/imoveis/details";

async function createImovelAd(formData: FormData) {
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

  if (!formData.get("area") || !formData.get("propertyCondition")) {
    throw new Error("Área e estado do imóvel são obrigatórios");
  }

  let price: number | null = null;
  let priceType: string | null = null;

  if (type === "venda") {
    priceType = (formData.get("priceType") as string) || "fixed";
    price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
  }
  // "leilao" não tem price/price_type próprios — o preço vive em
  // marketplace_auctions (current_price), criado pelo trigger a partir de
  // details.start_price.

  const details = buildImovelDetails(type, formData);

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .insert({
      author_id: user.id,
      module: "imoveis",
      title,
      description,
      type,
      category_id: parseInt(categoryId),
      location,
      contact_method: contactMethod,
      price_type: priceType,
      price,
      status: "active",
      details,
    })
    .select("id")
    .single();

  if (adError || !ad) {
    throw new Error("Erro ao criar anúncio: " + adError?.message);
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

  redirect(`/imoveis/${ad.id}`);
}

export default async function NovoImovelPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "imoveis")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  return (
    <>
      <ImoveisNavbar />
      <div className="min-h-screen bg-imoveis-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/imoveis" className="text-imoveis-700 hover:text-imoveis-900">
              ← Voltar aos Imóveis
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-imoveis-900">Publicar Imóvel</h1>
            <p className="text-imoveis-700 mt-2">Venda direta ou leilão — preenche os dados essenciais</p>
          </div>

          <ImovelAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createImovelAd}
            submitLabel="Publicar Imóvel"
          />
        </main>
      </div>
    </>
  );
}
