import { createClient } from "@/lib/supabase/server";
import {
  IMAGEM_MAX_FICHEIROS,
  extensaoParaImagem,
  validarImagem,
} from "@/lib/uploads/validar-imagem";
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
