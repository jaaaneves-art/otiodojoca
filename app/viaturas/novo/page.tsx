import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ViaturaAdForm } from "@/components/viaturas/viatura-ad-form";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { ArrowLeft, CircleCheckBig } from "lucide-react";

async function createViaturaAd(formData: FormData) {
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

  const parseCatalogId = (value: FormDataEntryValue | null) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  };

  const vehicleMakeId = parseCatalogId(formData.get("vehicleMakeId"));
  const vehicleModelId = parseCatalogId(formData.get("vehicleModelId"));
  const vehicleGenerationId = parseCatalogId(formData.get("vehicleGenerationId"));
  const vehicleVariantId = parseCatalogId(formData.get("vehicleVariantId"));

  const veiculoDetails: Record<string, string> = {
    marca: (formData.get("marca") as string) || "",
    modelo: (formData.get("modelo") as string) || "",
    geracao: (formData.get("geracao") as string) || "",
    variante: (formData.get("variante") as string) || "",
    ano: (formData.get("ano") as string) || "",
    quilometros: (formData.get("quilometros") as string) || "",
    combustivel: (formData.get("combustivel") as string) || "",
    caixa: (formData.get("caixa") as string) || "",
    condicao: (formData.get("condicao") as string) || "",
    cor: (formData.get("cor") as string) || "",
    potencia: (formData.get("potencia") as string) || "",
    cilindrada: (formData.get("cilindrada") as string) || "",
    tracao: (formData.get("tracao") as string) || "",
    tipo_vendedor: (formData.get("tipoVendedor") as string) || "Particular",
  };

  let price: number | null = null;
  let priceType: string | null = null;
  let details: Record<string, string> = veiculoDetails;

  if (type === "venda") {
    priceType = (formData.get("priceType") as string) || "fixed";
    price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
  } else if (type === "leilao") {
    // Convertido para ISO (UTC) no browser antes de chegar aqui — ver
    // viatura-ad-form.tsx (datetimeLocalParaIso). O trigger
    // gran_bazar_create_auction_if_needed (ver
    // supabase/migrations/20260824000000_viaturas.sql) lê estas chaves com
    // ::numeric/::timestamptz explícitos e cria a linha em
    // marketplace_auctions — mesmo motor do Gran Bazar, ver docs/VIATURAS.md.
    const startPrice = formData.get("auctionStartPrice") as string;
    const minIncrement = formData.get("auctionMinIncrement") as string;
    const startsAt = formData.get("auctionStartsAt") as string;
    const endsAt = formData.get("auctionEndsAt") as string;

    if (!startPrice || !endsAt) {
      throw new Error("Leilão: preço inicial e data de encerramento são obrigatórios");
    }

    details = {
      ...veiculoDetails,
      start_price: startPrice,
      minimum_increment: minIncrement || "50.00",
      ...(startsAt ? { starts_at: startsAt } : {}),
      ends_at: endsAt,
    };
  } else if (type === "comprar") {
    // "Procuro comprar" -- sem preço propriamente dito, só um orçamento
    // opcional (o mesmo padrão do "procura" no Gran Bazar). price_type tem
    // um CHECK na base de dados (fixed/negotiable/free) -- "budget" não é
    // um valor válido, por isso fica a null (o orçamento vive só em
    // details.budget e em price, para dar para ordenar/filtrar).
    const budget = formData.get("budget") as string;
    priceType = null;
    price = budget ? parseFloat(budget) : null;
    details = { ...veiculoDetails, budget: budget || "" };
  } else if (type === "ceder") {
    // Ceder = dar/entregar de graça ou por valor simbólico (equivalente ao
    // "oferta" do Gran Bazar) -- sem preço.
    priceType = "free";
    price = null;
  } else if (type === "alugar") {
    const precoDia = formData.get("precoDia") as string;
    const preco3Dias = formData.get("preco3Dias") as string;
    const precoSemana = formData.get("precoSemana") as string;
    const preco2Semanas = formData.get("preco2Semanas") as string;
    const precoMes = formData.get("precoMes") as string;
    const caucao = formData.get("caucao") as string;
    const seguro = (formData.get("seguroIncluido") as string) || "Incluído";

    if (!precoDia) {
      throw new Error("Alugar: o preço por dia é obrigatório");
    }

    // "fixed" (não "aluguer") porque price_type tem um CHECK na base de
    // dados restrito a fixed/negotiable/free -- é mesmo um preço fixo
    // (por dia), só que com esta o preço por dia guardado.
    priceType = "fixed";
    price = parseFloat(precoDia);
    details = {
      ...veiculoDetails,
      preco_dia: precoDia,
      ...(preco3Dias ? { preco_3_dias: preco3Dias } : {}),
      ...(precoSemana ? { preco_semana: precoSemana } : {}),
      ...(preco2Semanas ? { preco_2_semanas: preco2Semanas } : {}),
      ...(precoMes ? { preco_mes: precoMes } : {}),
      ...(caucao ? { caucao } : {}),
      seguro,
    };
  }

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .insert({
      author_id: user.id,
      module: "viaturas",
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
      vehicle_make_id: vehicleMakeId,
      vehicle_model_id: vehicleModelId,
      vehicle_generation_id: vehicleGenerationId,
      vehicle_variant_id: vehicleVariantId,
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

  redirect(`/viaturas/${ad.id}`);
}

export default async function NovoAnuncioViaturaPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "viaturas")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-9">
          <Link href="/viaturas" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"><ArrowLeft size={17} /> Voltar às viaturas</Link>

          <header className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Vender no StandGo</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-5xl">Publica sem complicações.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Preenche os dados com atenção. Uma descrição clara e fotografias reais ajudam-te a receber contactos mais relevantes.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><CircleCheckBig size={15} className="text-emerald-600" /> Publicação simples</span><span className="inline-flex items-center gap-1.5"><CircleCheckBig size={15} className="text-emerald-600" /> Até 5 fotografias</span><span className="inline-flex items-center gap-1.5"><CircleCheckBig size={15} className="text-emerald-600" /> Contacto protegido</span></div>
          </header>

          <ViaturaAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createViaturaAd}
            submitLabel="Publicar Anúncio"
          />
        </main>
      </div>
    </>
  );
}
