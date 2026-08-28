import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactSellerForm from "@/components/imoveis/contact-seller-form";
import FavoriteButton from "@/components/imoveis/favorite-button";
import ImoveisNavbar from "@/components/imoveis/imoveis-navbar";
import AuctionPanel from "@/components/imoveis/auction-panel";
import { IMOVEL_AD_TYPES, propertyConditionLabel, comodidadeLabel } from "@/lib/imoveis/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  reserved: "Reservado",
  sold: "Vendido",
  expired: "Expirado",
  cancelled: "Cancelado",
  inactive: "Indisponível",
};

export default async function ImovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select(`*, author:profiles(id, username, avatar_url), category:categories(id, name)`)
    .eq("id", id)
    .eq("module", "imoveis")
    .single();

  if (error || !ad) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("marketplace_photos")
    .select("*")
    .eq("ad_id", ad.id)
    .order("sort_order", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  let isFavorite = false;
  if (user) {
    const { data: fav } = await supabase
      .from("marketplace_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("ad_id", ad.id)
      .maybeSingle();
    isFavorite = !!fav;
  }

  let auction: any = null;
  let auctionBids: any[] = [];
  if (ad.type === "leilao") {
    const { data: auctionRow } = await supabase
      .from("marketplace_auctions")
      .select("id, ad_id, current_price, minimum_increment, starts_at, ends_at, status, winner_id")
      .eq("ad_id", ad.id)
      .maybeSingle();
    auction = auctionRow;

    if (auction) {
      const { data: bidsData } = await supabase
        .from("marketplace_auction_bids")
        .select("id, bidder_id, amount, created_at, bidder:profiles(username)")
        .eq("auction_id", auction.id)
        .order("amount", { ascending: false });
      auctionBids = (bidsData ?? []).map((b: any) => ({
        id: b.id,
        bidder_id: b.bidder_id,
        amount: b.amount,
        created_at: b.created_at,
        bidder_username: b.bidder?.username,
      }));
    }
  }

  const typeInfo = IMOVEL_AD_TYPES[ad.type];
  const details = ad.details || {};

  const caracteristicas = [
    { label: "Área", value: details.area != null ? `${details.area} m²` : null },
    { label: "Quartos", value: details.bedrooms != null ? details.bedrooms : null },
    { label: "WC", value: details.bathrooms != null ? details.bathrooms : null },
    { label: "Ano de construção", value: details.year_built != null ? details.year_built : null },
    { label: "Estado", value: propertyConditionLabel(details.condition) },
    { label: "Mobilado", value: details.mobilado === "sim" ? "Sim" : details.mobilado === "nao" ? "Não" : null },
    {
      label: "Despesas incluídas",
      value: details.despesas_incluidas === "sim" ? "Sim" : details.despesas_incluidas === "nao" ? "Não" : details.despesas_incluidas === "parcialmente" ? "Parcialmente" : null,
    },
    { label: "Caução", value: details.caucao != null ? `${Number(details.caucao).toLocaleString("pt-PT")} €` : null },
    {
      label: "Disponível a partir de",
      value: details.disponivel_desde ? new Date(details.disponivel_desde).toLocaleDateString("pt-PT") : null,
    },
    { label: "Duração mínima", value: details.duracao_minima != null ? `${details.duracao_minima} meses` : null },
    { label: "Vagas disponíveis", value: details.vagas_disponiveis != null ? details.vagas_disponiveis : null },
    { label: "Dirigido a estudantes", value: details.para_estudantes ? "Sim" : null },
    { label: "Tipo de quarto", value: details.tipo_quarto === "privado" ? "Privado" : details.tipo_quarto === "partilhado" ? "Partilhado" : null },
    { label: "Casa de banho", value: details.casa_banho === "privada" ? "Privada" : details.casa_banho === "partilhada" ? "Partilhada" : null },
    { label: "Pessoas a viver na casa", value: details.pessoas_na_casa != null ? details.pessoas_na_casa : null },
    { label: "Aceita casais", value: details.aceita_casais ? "Sim" : null },
    {
      label: "Comodidades",
      value: details.comodidades ? (details.comodidades as string).split(",").map(comodidadeLabel).join(", ") : null,
    },
  ].filter((c) => c.value != null && c.value !== "—");

  return (
    <>
      <ImoveisNavbar />
      <div className="min-h-screen bg-imoveis-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-4">
            <Link href="/imoveis" className="text-imoveis-700 hover:text-imoveis-900">
              ← Voltar aos Imóveis
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-imoveis-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-2 bg-imoveis-600 text-white">
                  {typeInfo?.icon} {typeInfo?.label ?? ad.type}
                </span>
                {ad.category?.name && (
                  <span className="inline-block text-xs font-medium text-imoveis-600 ml-2">{ad.category.name}</span>
                )}
                <h1 className="text-3xl font-bold text-imoveis-900 mt-1">{ad.title}</h1>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                ad.status === "active" ? "bg-green-100 text-green-700" :
                ad.status === "sold" ? "bg-gray-100 text-gray-600" :
                "bg-imoveis-100 text-imoveis-700"
              }`}>
                {STATUS_LABEL[ad.status] ?? ad.status}
              </span>
            </div>

            {photos && photos.length > 0 && (
              <div className="mb-6">
                <div className="mb-3">
                  <img src={photos[0].storage_path} alt={ad.title} className="w-full h-96 object-cover rounded-lg border border-imoveis-200" />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((photo: any) => (
                      <img key={photo.id} src={photo.storage_path} alt="" className="w-full h-20 object-cover rounded-lg border border-imoveis-200 cursor-pointer hover:border-imoveis-500" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {ad.type === "leilao" ? (
              auction ? (
                <AuctionPanel auction={auction} sellerId={ad.author_id} currentUserId={user?.id} bids={auctionBids} />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
                  Este leilão ainda não tem dados associados — tenta novamente dentro de instantes.
                </div>
              )
            ) : ad.type === "arrendamento" || ad.type === "quarto" ? (
              <div className="text-2xl font-bold text-imoveis-700 mb-6">
                {ad.price == null ? "Renda sob consulta" : ad.price.toLocaleString("pt-PT") + " €/mês"}
                {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
              </div>
            ) : ad.type === "permuta" ? (
              <div className="mb-6">
                <p className="text-xl font-bold text-purple-700 mb-2">🔄 Permuta</p>
                {details.procura_em_troca && (
                  <p className="text-imoveis-800 whitespace-pre-wrap">Procura em troca: {details.procura_em_troca}</p>
                )}
                {details.aceita_com_diferenca && (
                  <p className="text-sm text-imoveis-600 mt-1">Aceita compensar/receber diferença em dinheiro.</p>
                )}
              </div>
            ) : ad.type === "companhia" ? (
              <div className="mb-6">
                <p className="text-xl font-bold text-rose-700 mb-2">🤝 Troca por companhia</p>
                {details.apoio_esperado && (
                  <p className="text-imoveis-800 whitespace-pre-wrap">O que se espera: {details.apoio_esperado}</p>
                )}
                {details.regras_da_casa && (
                  <p className="text-imoveis-700 whitespace-pre-wrap mt-2">Regras da casa: {details.regras_da_casa}</p>
                )}
              </div>
            ) : (
              <div className="text-2xl font-bold text-imoveis-700 mb-6">
                {ad.price == null ? "Preço sob consulta" : ad.price.toLocaleString("pt-PT") + " €"}
                {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
              </div>
            )}

            {caracteristicas.length > 0 && (
              <div className="mb-8 pb-8 border-b border-imoveis-200">
                <h2 className="text-lg font-semibold text-imoveis-900 mb-4">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {caracteristicas.map((c) => (
                    <div key={c.label}>
                      <p className="text-sm text-imoveis-600">{c.label}</p>
                      <p className="font-semibold text-imoveis-900">{c.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-imoveis-200">
              <h2 className="text-lg font-semibold text-imoveis-900 mb-3">Descrição</h2>
              <p className="text-imoveis-800 whitespace-pre-wrap">{ad.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-imoveis-200">
              <div>
                <p className="text-sm text-imoveis-600">Localização</p>
                <p className="font-semibold text-imoveis-900">📍 {ad.location}</p>
              </div>
              <div>
                <p className="text-sm text-imoveis-600">Publicado em</p>
                <p className="font-semibold text-imoveis-900">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</p>
              </div>
              <div>
                <p className="text-sm text-imoveis-600">Contacto</p>
                <p className="font-semibold text-imoveis-900">
                  {ad.contact_method === "message" ? "💬 Mensagem" :
                   ad.contact_method === "phone" ? "📞 Telefone" : "📧 Email"}
                </p>
              </div>
            </div>

            <div className="bg-imoveis-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-imoveis-900 mb-4">Anunciante</h2>
              {ad.author ? (
                <div className="flex items-center gap-4">
                  {ad.author.avatar_url && (
                    <img src={ad.author.avatar_url} alt={ad.author.username} className="w-16 h-16 rounded-full" />
                  )}
                  <div>
                    <p className="font-semibold text-imoveis-900">{ad.author.username}</p>
                    <Link href={`/perfil/${ad.author.id}`} className="text-imoveis-700 hover:text-imoveis-900">
                      Ver Perfil →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-imoveis-700">Utilizador não encontrado</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <ContactSellerForm adId={ad.id} sellerId={ad.author_id} currentUserId={user?.id} />
              <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={!!user} variant="detail" />
              <Link href="/imoveis" className="flex-1">
                <button className="w-full border border-imoveis-200 text-imoveis-700 font-medium py-3 px-4 rounded-lg hover:bg-imoveis-50">
                  Voltar à Lista
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
