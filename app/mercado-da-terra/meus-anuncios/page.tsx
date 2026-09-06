import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";

export default async function MeusAnunciosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", user.id)
    .eq("module", "mercado-da-terra")
    .order("created_at", { ascending: false });

  const activeAds = ads?.filter(ad => ad.status === "active") || [];
  const soldAds = ads?.filter(ad => ad.status === "sold") || [];

  // Primeira foto de cada anúncio (mesma lógica da página principal do Mercado)
  const adIds = (ads || []).map((ad) => ad.id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((photo: any) => {
      if (!photosMap[photo.ad_id]) {
        photosMap[photo.ad_id] = photo.storage_path;
      }
    });
  }

  return (
    <>
      <MarketplaceNavbar />
      <div className="min-h-screen bg-terra-50">
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Meus Anúncios</h1>
        <p className="text-terra-600 mb-8">Gerencia todos os teus anúncios</p>

        {/* Anúncios Ativos */}
        {activeAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Ativos ({activeAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAds.map((ad) => (
                /* O cartão deixou de ser um <Link> inteiro: um link dentro
                   de outro é HTML inválido. A área de conteúdo é o link;
                   a barra de ações fica fora dele. */
                <div
                  key={ad.id}
                  className="bg-white rounded-lg border border-terra-200 hover:shadow-md transition h-full overflow-hidden flex flex-col"
                >
                  <Link href={`/mercado-da-terra/${ad.id}`} className="block">
                    {photosMap[ad.id] ? (
                      <div className="w-full h-40 bg-terra-100">
                        <img src={photosMap[ad.id]} alt={ad.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-terra-100 flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-terra-800">{ad.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Ativo</span>
                      </div>
                      <p className="text-sm text-terra-600 mb-2">{ad.category_id}</p>
                      <p className="text-lg font-bold text-terra-700 mb-2">
                        {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-terra-500">📍 {ad.location}</p>
                    </div>
                  </Link>

                  {/* Ações */}
                  <div className="mt-auto flex border-t border-terra-100">
                    <Link
                      href={`/mercado-da-terra/editar/${ad.id}`}
                      className="flex-1 text-center text-sm font-medium text-terra-700 py-3 hover:bg-terra-50 transition"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/mercado-da-terra/${ad.id}`}
                      className="flex-1 text-center text-sm font-medium text-terra-600 py-3 border-l border-terra-100 hover:bg-terra-50 transition"
                    >
                      Ver anúncio
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anúncios Vendidos */}
        {soldAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Vendidos ({soldAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldAds.map((ad) => (
                <div key={ad.id} className="bg-white rounded-lg border border-terra-200 overflow-hidden flex flex-col">
                  <div className="opacity-60">
                    {photosMap[ad.id] ? (
                      <div className="w-full h-40 bg-terra-100">
                        <img src={photosMap[ad.id]} alt={ad.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-terra-100 flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-terra-800">{ad.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Vendido</span>
                      </div>
                      <p className="text-sm text-terra-600 mb-2">{ad.category_id}</p>
                      <p className="text-lg font-bold text-terra-700 mb-2">
                        {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-terra-500">📍 {ad.location}</p>
                    </div>
                  </div>

                  {/* Um anúncio vendido continua a poder ser corrigido —
                      p. ex. para o reabrir ou acertar a descrição. */}
                  <div className="mt-auto flex border-t border-terra-100">
                    <Link
                      href={`/mercado-da-terra/editar/${ad.id}`}
                      className="flex-1 text-center text-sm font-medium text-terra-700 py-3 hover:bg-terra-50 transition"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/mercado-da-terra/${ad.id}`}
                      className="flex-1 text-center text-sm font-medium text-terra-600 py-3 border-l border-terra-100 hover:bg-terra-50 transition"
                    >
                      Ver anúncio
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem Anúncios */}
        {ads && ads.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
            <p className="text-terra-600 text-lg mb-4">Ainda não tens nenhum anúncio publicado</p>
            <Link href="/mercado-da-terra/novo">
              <button className="bg-terra-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-terra-700">
                Publicar Primeiro Anúncio
              </button>
            </Link>
          </div>
        )}
      </main>
      </div>
    </>
  );
}
