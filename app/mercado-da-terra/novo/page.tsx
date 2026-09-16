import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdForm } from "@/components/mercado-da-terra/ad-form";
import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";
import {
  IMAGEM_MAX_FICHEIROS,
  extensaoParaImagem,
  validarImagem,
} from "@/lib/uploads/validar-imagem";

async function createAd(formData: FormData) {
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
  // "image_count" continua a vir do cliente, mas é só um limite superior
  // do ciclo abaixo -- nunca é gravado nem confiado sem mais. Cada
  // ficheiro é lido e validado individualmente antes de qualquer upload.
  const imageCountBruto = parseInt(formData.get("image_count") as string) || 0;
  const imageCount = Math.min(Math.max(imageCountBruto, 0), IMAGEM_MAX_FICHEIROS);

  // Valida TODAS as imagens antes de criar o anúncio -- se alguma for
  // inválida, falha cedo e não deixa um anúncio sem fotos (ou com fotos a
  // meio) para trás.
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

  const details: Record<string, string> = {};
  if (seeking) details.seeking = seeking;
  if (seekingDescription) details.seeking_description = seekingDescription;
  if (wantsToReceive) details.wants_to_receive = wantsToReceive;

  // RPC-only: 20260913180000 revogou INSERT direto em marketplace_ads;
  // 20260913232000 criou esta função dedicada (ver
  // docs/pendentes/20260913T2119-correcao-marketplace-4-modulos.md).
  const { data: adId, error: adError } = await supabase.rpc(
    "marketplace_ad_criar_completo",
    {
      p_module: "mercado-da-terra",
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

  console.log(`✅ Anúncio ${adId} criado`);

  for (let i = 0; i < ficheiros.length; i++) {
    const file = ficheiros[i];

    console.log(`📤 Upload imagem ${i + 1}/${ficheiros.length}: ${file.name}`);

    // Nome sempre gerado pelo servidor (nunca a partir de file.name) e
    // com a extensão a corresponder ao MIME real, já confirmado por
    // validarImagem() acima -- não força mais ".jpg" para tudo.
    const fileName = `${adId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extensaoParaImagem(file.type)}`;

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
        ad_id: adId,
        storage_path: photoUrl.publicUrl,
        sort_order: i,
      });

    console.log(`✅ Foto ${i + 1} OK`);
  }

  redirect(`/mercado-da-terra/${adId}`);
}

export default async function NovoAnuncioPage() {
  const supabase = await createClient();

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
