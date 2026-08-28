import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ImovelAdForm } from "@/components/imoveis/imoveis-ad-form";
import ImoveisNavbar from "@/components/imoveis/imoveis-navbar";
import { buildImovelDetails } from "@/lib/imoveis/details";

export default async function EditarImovelPage({
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
    .eq("module", "imoveis")
    .single();

  if (error || !ad) {
    notFound();
  }

  if (ad.author_id !== user.id) {
    redirect("/imoveis");
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
    .eq("type", "imoveis")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  async function updateImovelAd(formData: FormData) {
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
    let priceType: string | null = null;

    if (type === "venda" || type === "arrendamento" || type === "quarto") {
      priceType = (formData.get("priceType") as string) || "fixed";
      price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    }

    // Só monta o payload de criação do leilão (start_price/ends_at/...) se
    // ainda não existir linha em marketplace_auctions para este anúncio —
    // é isso que o trigger vai ler de NEW.details nesta UPDATE. Se já
    // existir leilão, os parâmetros são atualizados em separado mais
    // abaixo, e o details fica só com as características do imóvel (por
    // isso "venda" aqui, e não "leilao" — buildImovelDetails só monta os
    // campos start_price/ends_at/etc quando o tipo passado é "leilao", e
    // esses campos vêm desativados do formulário depois de o leilão já ter
    // começado, logo nem chegam a estar em formData).
    // Para os restantes tipos (venda/arrendamento/permuta/companhia) passa
    // sempre o tipo real, para não perder os campos próprios de cada um.
    const details = type === "leilao"
      ? (auction ? buildImovelDetails("venda", formData) : buildImovelDetails(type, formData))
      : buildImovelDetails(type, formData);

    // "quarto" não mostra o seletor de "Tipo de imóvel" — a categoria é
    // sempre atribuída à categoria "Quarto" já existente (ver o mesmo
    // comentário em app/imoveis/novo/page.tsx).
    let categoryIdValue: number | null = null;
    if (type === "quarto") {
      const { data: quartoCategoria } = await supabase
        .from("categories")
        .select("id")
        .eq("type", "imoveis")
        .eq("slug", "imoveis-quarto")
        .maybeSingle();
      categoryIdValue = quartoCategoria?.id ?? null;
    } else {
      categoryIdValue = categoryId ? parseInt(categoryId) : null;
    }

    const { error: updateError } = await supabase
      .from("marketplace_ads")
      .update({
        title,
        description,
        type,
        category_id: categoryIdValue,
        location,
        contact_method: contactMethod,
        price_type: priceType,
        price,
        details,
      })
      .eq("id", ad.id)
      .eq("module", "imoveis");

    if (updateError) {
      throw new Error("Erro ao atualizar: " + updateError.message);
    }

    // Leilão já existente: atualizar os parâmetros diretamente em
    // marketplace_auctions. A RLS só permite isto enquanto status =
    // 'scheduled' (ver migration 20260823000000_gran_bazar_leiloes_ativos.sql,
    // reaproveitada tal e qual) — se o leilão já começou, este update
    // simplesmente não afeta nenhuma linha (0 rows), o que é o
    // comportamento correto: o formulário já mostra os campos desativados
    // nesse caso, isto é só a segunda linha de defesa do lado do servidor.
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
          minimum_increment: minIncrement ? parseFloat(minIncrement) : 1000.0,
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

    redirect(`/imoveis/${ad.id}`);
  }

  const details = ad.details || {};

  return (
    <>
      <ImoveisNavbar />
      <div className="min-h-screen bg-imoveis-50">
        <main className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href={`/imoveis/${ad.id}`} className="text-imoveis-700 hover:text-imoveis-900">
              ← Voltar ao Imóvel
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-imoveis-900">Editar Imóvel</h1>
            <p className="text-imoveis-700 mt-2">{ad.title}</p>
          </div>

          <ImovelAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={updateImovelAd}
            inicial={{
              type: ad.type,
              title: ad.title,
              description: ad.description,
              category_id: ad.category_id,
              price_type: ad.price_type,
              price: ad.price,
              location: ad.location,
              contact_method: ad.contact_method,
              area: details.area,
              bedrooms: details.bedrooms,
              bathrooms: details.bathrooms,
              year_built: details.year_built,
              property_condition: details.condition,
              auction_start_price: auction?.start_price,
              auction_minimum_increment: auction?.minimum_increment,
              auction_starts_at: auction?.starts_at,
              auction_ends_at: auction?.ends_at,
              auction_status: auction?.status,
              mobilado: details.mobilado,
              despesas_incluidas: details.despesas_incluidas,
              caucao: details.caucao,
              disponivel_desde: details.disponivel_desde,
              duracao_minima: details.duracao_minima,
              para_estudantes: details.para_estudantes,
              vagas_disponiveis: details.vagas_disponiveis,
              procura_em_troca: details.procura_em_troca,
              aceita_com_diferenca: details.aceita_com_diferenca,
              apoio_esperado: details.apoio_esperado,
              regras_da_casa: details.regras_da_casa,
              tipo_quarto: details.tipo_quarto,
              casa_banho: details.casa_banho,
              pessoas_na_casa: details.pessoas_na_casa,
              comodidades: details.comodidades,
              aceita_casais: details.aceita_casais,
            }}
            submitLabel="Guardar Alterações"
          />
        </main>
      </div>
    </>
  );
}
