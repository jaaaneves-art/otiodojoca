import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ViaturaAdForm } from "@/components/viaturas/viatura-ad-form";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";

export default async function EditarAnuncioViaturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", id)
    .eq("module", "viaturas")
    .single();

  if (error || !ad) {
    notFound();
  }

  if (ad.author_id !== user.id) {
    redirect("/viaturas");
  }

  let auction: {
    start_price: number;
    minimum_increment: number;
    starts_at: string;
    ends_at: string;
    status: string;
  } | null = null;

  if (ad.type === "leilao") {
    const { data: auctionRow } = await supabase
      .from("marketplace_auctions")
      .select("start_price, minimum_increment, starts_at, ends_at, status")
      .eq("ad_id", ad.id)
      .maybeSingle();
    auction = auctionRow;
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

  async function updateViaturaAd(formData: FormData) {
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

    const veiculoDetails: Record<string, string> = {
      marca: (formData.get("marca") as string) || "",
      modelo: (formData.get("modelo") as string) || "",
      ano: (formData.get("ano") as string) || "",
      quilometros: (formData.get("quilometros") as string) || "",
      combustivel: (formData.get("combustivel") as string) || "",
      caixa: (formData.get("caixa") as string) || "",
      condicao: (formData.get("condicao") as string) || "",
      cor: (formData.get("cor") as string) || "",
      potencia: (formData.get("potencia") as string) || "",
      tipo_vendedor: (formData.get("tipoVendedor") as string) || "Particular",
    };

    let price: number | null = null;
    let priceType: string | null = null;
    let details: Record<string, string> = veiculoDetails;

    if (type === "venda") {
      priceType = (formData.get("priceType") as string) || "fixed";
      price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    } else if (type === "leilao" && !auction) {
      // Anúncio a mudar para "leilão" pela primeira vez (ainda não existe
      // nenhuma linha em marketplace_auctions) — monta aqui o mesmo payload
      // de criação que o novo/page.tsx monta, porque é isto que o trigger
      // gran_bazar_create_auction_if_needed vai ler de NEW.details nesta
      // mesma UPDATE. Se já existir leilão (auction != null), os parâmetros
      // são atualizados em separado mais abaixo.
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
    } else if (type === "leilao" && auction) {
      // Já existe leilão — details mantém os campos do leilão originais
      // (não passam pelo formulário nesta fase); só os dados da viatura são
      // atualizados aqui.
      details = { ...ad.details, ...veiculoDetails };
    }

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
      .eq("id", ad.id)
      .eq("module", "viaturas");

    if (updateError) {
      throw new Error("Erro ao atualizar: " + updateError.message);
    }

    // Leilão: atualizar os parâmetros diretamente em marketplace_auctions.
    // A RLS (mesma do Gran Bazar) só permite isto enquanto status =
    // 'scheduled' — se o leilão já começou, este update simplesmente não
    // afeta nenhuma linha, o que é o comportamento correto: o formulário já
    // mostra os campos desativados nesse caso.
    if (type === "leilao" && auction && auction.status === "scheduled") {
      const startPrice = formData.get("auctionStartPrice") as string;
      const minIncrement = formData.get("auctionMinIncrement") as string;
      const startsAt = formData.get("auctionStartsAt") as string;
      const endsAt = formData.get("auctionEndsAt") as string;

      if (!startPrice || !endsAt) {
        throw new Error("Leilão: preço inicial e data de encerramento são obrigatórios");
      }

      const { error: auctionError } = await supabase
        .from("marketplace_auctions")
        .update({
          start_price: parseFloat(startPrice),
          current_price: parseFloat(startPrice),
          minimum_increment: minIncrement ? parseFloat(minIncrement) : 50.0,
          starts_at: startsAt || new Date().toISOString(),
          ends_at: endsAt,
        })
        .eq("ad_id", ad.id);

      if (auctionError) {
        throw new Error("Erro ao atualizar leilão: " + auctionError.message);
      }
    }

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

      await supabase.from("marketplace_photos").insert({
        ad_id: ad.id,
        storage_path: photoUrl.publicUrl,
        sort_order: i,
      });
    }

    redirect(`/viaturas/${ad.id}`);
  }

  const d = ad.details ?? {};

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href={`/viaturas/${ad.id}`} className="text-viaturas-700 hover:text-viaturas-900">
              ← Voltar ao Anúncio
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-viaturas-900">Editar Anúncio</h1>
            <p className="text-viaturas-700 mt-2">{ad.title}</p>
          </div>

          <ViaturaAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={updateViaturaAd}
            inicial={{
              type: ad.type,
              title: ad.title,
              description: ad.description,
              category_id: ad.category_id,
              price_type: ad.price_type,
              price: ad.price,
              location: ad.location,
              contact_method: ad.contact_method,
              marca: d.marca,
              modelo: d.modelo,
              ano: d.ano,
              quilometros: d.quilometros,
              combustivel: d.combustivel,
              caixa: d.caixa,
              cor: d.cor,
              potencia: d.potencia,
              condicao: d.condicao,
              tipo_vendedor: d.tipo_vendedor,
              auction_start_price: auction?.start_price,
              auction_minimum_increment: auction?.minimum_increment,
              auction_starts_at: auction?.starts_at,
              auction_ends_at: auction?.ends_at,
              auction_status: auction?.status,
            }}
            submitLabel="Guardar Alterações"
          />
        </main>
      </div>
    </>
  );
}
