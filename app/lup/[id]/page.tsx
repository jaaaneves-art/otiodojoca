import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactSellerForm from "@/components/lup/contact-seller-form";
import LupFavoriteButton from "@/components/lup/favorite-button";
import LupNavbar from "@/components/lup/lup-navbar";
import { LUP_AD_TYPES, estimarCo2Evitado } from "@/lib/lup/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  traded: "Trocado",
  given: "Entregue",
  expired: "Expirado",
  cancelled: "Cancelado",
  inactive: "Indisponível",
};

const CATEGORIA_ICON: Record<string, string> = {
  "lup-humano": "🥗",
  "lup-animal": "🐾",
  "lup-compostagem": "🌱",
};

function formatarDataHora(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

export default async function LupAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select(`*, author:profiles(id, username, avatar_url), category:categories(name, slug)`)
    .eq("id", id)
    .eq("module", "lup")
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

  const typeInfo = LUP_AD_TYPES[ad.type];
  const details = ad.details ?? {};
  const co2 = estimarCo2Evitado(details.kg_estimate ? parseFloat(details.kg_estimate) : null);
  const inicio = formatarDataHora(details.pickup_starts_at);
  const fim = formatarDataHora(details.pickup_ends_at);

  return (
    <>
      <LupNavbar />
      <div className="min-h-screen bg-lup-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-4">
            <Link href="/lup" className="text-lup-700 hover:text-lup-900">
              ← Voltar ao Lup
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-lup-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-lup-600 text-white">
                    {typeInfo?.icon} {typeInfo?.label ?? ad.type}
                  </span>
                  {ad.category && (
                    <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-lup-50 text-lup-700 border border-lup-200">
                      {CATEGORIA_ICON[ad.category.slug] ?? "📦"} {ad.category.name}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-lup-900">{ad.title}</h1>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                ad.status === "active" ? "bg-green-100 text-green-700" :
                ["sold", "traded", "given"].includes(ad.status) ? "bg-gray-100 text-gray-600" :
                "bg-lup-100 text-lup-700"
              }`}>
                {STATUS_LABEL[ad.status] ?? ad.status}
              </span>
            </div>

            {photos && photos.length > 0 && (
              <div className="mb-6">
                <div className="mb-3">
                  <img src={photos[0].storage_path} alt={ad.title} className="w-full h-96 object-cover rounded-lg border border-lup-200" />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((photo: any) => (
                      <img key={photo.id} src={photo.storage_path} alt="" className="w-full h-20 object-cover rounded-lg border border-lup-200 cursor-pointer hover:border-lup-500" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {ad.type === "procura" ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-600 font-semibold">🙋 Este anúncio é um pedido de recolha</p>
              </div>
            ) : (
              <div className="text-2xl font-bold text-lup-700 mb-6">
                {ad.type === "oferta" || ad.price == null ? "GRÁTIS" : `${ad.price.toFixed(2)} €`}
              </div>
            )}

            {(details.quantity || co2 != null || inicio || fim) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-lup-200">
                {details.quantity && (
                  <div>
                    <p className="text-sm text-lup-600">Quantidade</p>
                    <p className="font-semibold text-lup-900">📦 {details.quantity} {details.unit ?? ""}</p>
                  </div>
                )}
                {co2 != null && (
                  <div>
                    <p className="text-sm text-lup-600">Impacto (estimativa)</p>
                    <p className="font-semibold text-lup-900">🌍 ~{co2} kg CO₂ evitado</p>
                  </div>
                )}
                {inicio && (
                  <div>
                    <p className="text-sm text-lup-600">Disponível a partir de</p>
                    <p className="font-semibold text-lup-900">{inicio}</p>
                  </div>
                )}
                {fim && (
                  <div>
                    <p className="text-sm text-amber-700">Recolher até</p>
                    <p className="font-semibold text-amber-800">⏰ {fim}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-lup-200">
              <h2 className="text-lg font-semibold text-lup-900 mb-3">Descrição</h2>
              <p className="text-lup-800 whitespace-pre-wrap">{ad.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-lup-200">
              <div>
                <p className="text-sm text-lup-600">Localização</p>
                <p className="font-semibold text-lup-900">📍 {ad.location}</p>
              </div>
              <div>
                <p className="text-sm text-lup-600">Publicado em</p>
                <p className="font-semibold text-lup-900">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</p>
              </div>
              <div>
                <p className="text-sm text-lup-600">Contacto</p>
                <p className="font-semibold text-lup-900">
                  {ad.contact_method === "message" ? "💬 Mensagem" :
                   ad.contact_method === "phone" ? "📞 Telefone" : "📧 Email"}
                </p>
              </div>
            </div>

            <div className="bg-lup-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-lup-900 mb-4">Anunciante</h2>
              {ad.author ? (
                <div className="flex items-center gap-4">
                  {ad.author.avatar_url && (
                    <img src={ad.author.avatar_url} alt={ad.author.username} className="w-16 h-16 rounded-full" />
                  )}
                  <div>
                    <p className="font-semibold text-lup-900">{ad.author.username}</p>
                    <Link href={`/perfil/${ad.author.id}`} className="text-lup-700 hover:text-lup-900">
                      Ver Perfil →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-lup-700">Utilizador não encontrado</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <ContactSellerForm adId={ad.id} sellerId={ad.author_id} currentUserId={user?.id} />
              <LupFavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={!!user} variant="detail" />
              <Link href="/lup" className="flex-1">
                <button className="w-full border border-lup-200 text-lup-700 font-medium py-3 px-4 rounded-lg hover:bg-lup-50">
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
