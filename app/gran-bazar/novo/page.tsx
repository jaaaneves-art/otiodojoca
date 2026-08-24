import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BazarAdForm } from "@/components/gran-bazar/bazar-ad-form";
import GranBazarNavbar from "@/components/gran-bazar/gran-bazar-navbar";

async function createBazarAd(formData: FormData) {
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
  const seeking = formData.get("seeking") as string | null;
  const imageCount = parseInt(formData.get("image_count") as string) || 0;

  let price: number | null = null;
  let priceType: string | null = null;
  let details: Record<string, string> = {};

  if (type === "venda") {
    priceType = (formData.get("priceType") as string) || "fixed";
    price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
  } else if (type === "oferta") {
    priceType = "free";
  } else if (type === "troca") {
    details = { seeking: seeking || "" };
  } else if (type === "leilao") {
    // Convertido para ISO (UTC) no browser antes de chegar aqui — ver
    // bazar-ad-form.tsx (datetimeLocalParaIso). O trigger
    // gran_bazar_create_auction_if_needed (migration de leilões) lê estas
    // chaves com ::numeric/::timestamptz explícitos e cria a linha em
    // marketplace_auctions.
    const startPrice = formData.get("auctionStartPrice") as string;
    const minIncrement = formData.get("auctionMinIncrement") as string;
    const startsAt = formData.get("auctionStartsAt") as string;
    const endsAt = formData.get("auctionEndsAt") as string;

    if (!startPrice || !endsAt) {
      throw new Error("Leilão: preço inicial e data de encerramento são obrigatórios");
    }

    details = {
      start_price: startPrice,
      minimum_increment: minIncrement || "1.00",
      ...(startsAt ? { starts_at: startsAt } : {}),
      ends_at: endsAt,
    };
  }
  // "procura" não tem preço nem campos extra — o título/descrição já dizem o que se procura.

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .insert({
      author_id: user.id,
      module: "gran-bazar",
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

  redirect(`/gran-bazar/${ad.id}`);
}

export default async function NovoAnuncioBazarPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "bazar")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  return (
    <>
      <GranBazarNavbar />
      <div className="min-h-screen bg-bazar-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/gran-bazar" className="text-bazar-700 hover:text-bazar-900">
              ← Voltar ao Gran Bazar
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-bazar-900">Criar Anúncio</h1>
            <p className="text-bazar-700 mt-2">Vende, troca, oferece ou pede o que precisas</p>
          </div>

          <BazarAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createBazarAd}
            submitLabel="Publicar Anúncio"
          />
        </main>
      </div>
    </>
  );
}
