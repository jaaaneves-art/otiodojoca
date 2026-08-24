import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactSellerForm from "@/components/gran-bazar/contact-seller-form";
import FavoriteButton from "@/components/gran-bazar/favorite-button";
import GranBazarNavbar from "@/components/gran-bazar/gran-bazar-navbar";
import AuctionPanel from "@/components/gran-bazar/auction-panel";
import { BAZAR_AD_TYPES } from "@/lib/gran-bazar/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  reserved: "Reservado",
  sold: "Vendido",
  traded: "Trocado",
  given: "Entregue",
  expired: "Expirado",
  cancelled: "Cancelado",
  inactive: "Indisponível",
};

export default async function BazarAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select(`*, author:profiles(id, username, avatar_url)`)
    .eq("id", id)
    .eq("module", "gran-bazar")
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

  const typeInfo = BAZAR_AD_TYPES[ad.type];

  return (
    <>
      <GranBazarNavbar />
      <div className="min-h-screen bg-bazar-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-4">
            <Link href="/gran-bazar" className="text-bazar-700 hover:text-bazar-900">
              ← Voltar ao Gran Bazar
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-bazar-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-2 bg-bazar-500 text-white">
                  {typeInfo?.icon} {typeInfo?.label ?? ad.type}
                </span>
                <h1 className="text-3xl font-bold text-bazar-900">{ad.title}</h1>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                ad.status === "active" ? "bg-green-100 text-green-700" :
                ad.status === "sold" || ad.status === "traded" || ad.status === "given" ? "bg-gray-100 text-gray-600" :
                "bg-bazar-100 text-bazar-700"
              }`}>
                {STATUS_LABEL[ad.status] ?? ad.status}
              </span>
            </div>

            {photos && photos.length > 0 && (
              <div className="mb-6">
                <div className="mb-3">
                  <img src={photos[0].storage_path} alt={ad.title} className="w-full h-96 object-cover rounded-lg border border-bazar-200" />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((photo: any) => (
                      <img key={photo.id} src={photo.storage_path} alt="" className="w-full h-20 object-cover rounded-lg border border-bazar-200 cursor-pointer hover:border-bazar-500" />
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
            ) : ad.type === "troca" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-600 font-semibold mb-1">🔄 Aceito troca por</p>
                <p className="text-lg text-blue-900">{ad.details?.seeking || "A combinar"}</p>
              </div>
            ) : ad.type === "oferta" ? (
              <div className="text-2xl font-bold text-green-700 mb-6">GRÁTIS</div>
            ) : ad.type === "procura" ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-600 font-semibold">🔍 Anúncio de procura</p>
              </div>
            ) : (
              <div className="text-2xl font-bold text-bazar-700 mb-6">
                {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                {ad.price_type === "negotiable" && ad.price != null && " (negociável)"}
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-bazar-200">
              <h2 className="text-lg font-semibold text-bazar-900 mb-3">Descrição</h2>
              <p className="text-bazar-800 whitespace-pre-wrap">{ad.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-bazar-200">
              <div>
                <p className="text-sm text-bazar-600">Localização</p>
                <p className="font-semibold text-bazar-900">📍 {ad.location}</p>
              </div>
              <div>
                <p className="text-sm text-bazar-600">Publicado em</p>
                <p className="font-semibold text-bazar-900">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</p>
              </div>
              <div>
                <p className="text-sm text-bazar-600">Contacto</p>
                <p className="font-semibold text-bazar-900">
                  {ad.contact_method === "message" ? "💬 Mensagem" :
                   ad.contact_method === "phone" ? "📞 Telefone" : "📧 Email"}
                </p>
              </div>
            </div>

            <div className="bg-bazar-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-bazar-900 mb-4">Anunciante</h2>
              {ad.author ? (
                <div className="flex items-center gap-4">
                  {ad.author.avatar_url && (
                    <img src={ad.author.avatar_url} alt={ad.author.username} className="w-16 h-16 rounded-full" />
                  )}
                  <div>
                    <p className="font-semibold text-bazar-900">{ad.author.username}</p>
                    <Link href={`/perfil/${ad.author.id}`} className="text-bazar-700 hover:text-bazar-900">
                      Ver Perfil →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-bazar-700">Utilizador não encontrado</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <ContactSellerForm adId={ad.id} sellerId={ad.author_id} currentUserId={user?.id} />
              <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={!!user} variant="detail" />
              <Link href="/gran-bazar" className="flex-1">
                <button className="w-full border border-bazar-200 text-bazar-700 font-medium py-3 px-4 rounded-lg hover:bg-bazar-50">
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
