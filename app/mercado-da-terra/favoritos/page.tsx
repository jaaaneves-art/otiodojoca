import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import FavoriteButton from "@/components/mercado-da-terra/favorite-button";

export default async function FavoritosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar favoritos do utilizador com o anúncio associado
  const { data: favorites } = await supabase
    .from("marketplace_favorites")
    .select(`
      id,
      ad_id,
      created_at,
      ad:marketplace_ads(id, title, price, price_type, location, status, type, details)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Só mostrar favoritos cujo anúncio ainda existe e está ativo
  const validFavorites = (favorites || []).filter((f: any) => f.ad && f.ad.status === "active");

  // Primeira foto de cada anúncio
  const adIds = validFavorites.map((f: any) => f.ad_id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((p: any) => {
      if (!photosMap[p.ad_id]) photosMap[p.ad_id] = p.storage_path;
    });
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-terra-900 mb-2">❤️ Os meus favoritos</h1>
        <p className="text-terra-600 mb-8">Anúncios que guardaste para ver mais tarde</p>

        {validFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validFavorites.map((fav: any) => {
              const ad = fav.ad;
              const firstPhoto = photosMap[ad.id];
              return (
                <div key={fav.id} className="relative">
                  <FavoriteButton adId={ad.id} isFavorite={true} isLoggedIn={true} variant="card" />
                  <Link href={`/mercado-da-terra/${ad.id}`}>
                    <div className="bg-white rounded-lg border border-terra-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
                      {firstPhoto ? (
                        <div className="w-full h-40 bg-terra-100">
                          <img src={firstPhoto} alt={ad.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-terra-100 flex items-center justify-center text-4xl">
                          📦
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="font-semibold text-terra-800 line-clamp-2 mb-2">{ad.title}</h3>
                        <div>
                          <p className="text-lg font-bold text-terra-700 mb-1">
                            {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-terra-500">📍 {ad.location}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
            <p className="text-terra-600 text-lg mb-4">Ainda não guardaste nenhum anúncio</p>
            <Link href="/mercado-da-terra">
              <button className="bg-terra-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-terra-700">
                Explorar o Mercado
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
