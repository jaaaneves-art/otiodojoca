import { createClient } from "@/lib/supabase/server";
import {
  IMAGEM_MAX_FICHEIROS,
  extensaoParaImagem,
  validarImagem,
} from "@/lib/uploads/validar-imagem";
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
  // "image_count" continua a vir do cliente, mas é só um limite
  // superior do ciclo abaixo -- nunca é gravado nem confiado sem mais.
  // Cada ficheiro é lido e validado individualmente antes de qualquer
  // upload (ver lib/uploads/validar-imagem.ts).
  const imageCountBruto = parseInt(formData.get("image_count") as string) || 0;
  const imageCount = Math.min(Math.max(imageCountBruto, 0), IMAGEM_MAX_FICHEIROS);

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

  // RPC-only: 20260913180000 revogou INSERT direto em marketplace_ads;
  // 20260913232000 criou esta função dedicada (ver
  // docs/pendentes/20260913T2119-correcao-marketplace-4-modulos.md).
  const { data: adId, error: adError } = await supabase.rpc(
    "marketplace_ad_criar_completo",
    {
      p_module: "gran-bazar",
      p_title: title,
      p_description: description,
      p_type: type,
      p_details: details,
      p_location: location,
      p_category_id: parseInt(categoryId),
      p_contact_method: contactMethod,
      p_price: price,
      p_price_type: priceType,
    }
  );

  if (adError || !adId) {
    throw new Error("Erro ao criar anúncio: " + adError?.message);
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

    const fileName = `${adId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extensaoParaImagem(file.type)}`;

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
      ad_id: adId,
      storage_path: photoUrl.publicUrl,
      sort_order: i,
    });
  }

  redirect(`/gran-bazar/${adId}`);
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
