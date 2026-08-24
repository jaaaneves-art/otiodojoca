import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import LupNavbar from "@/components/lup/lup-navbar";
import { LupAdCard } from "@/components/lup/lup-ad-card";

export default async function FavoritosLupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: favs } = await supabase
    .from("marketplace_favorites")
    .select("ad_id")
    .eq("user_id", user.id);

  const favAdIds = (favs || []).map((f: any) => f.ad_id);

  let ads: any[] = [];
  if (favAdIds.length > 0) {
    const { data } = await supabase
      .from("marketplace_ads")
      .select("*, category:categories(name, slug)")
      .in("id", favAdIds)
      .eq("module", "lup");
    ads = data || [];
  }

  const adIds = ads.map((a) => a.id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((photo: any) => {
      if (!photosMap[photo.ad_id]) photosMap[photo.ad_id] = photo.storage_path;
    });
  }

  return (
    <>
      <LupNavbar />
      <div className="min-h-screen bg-lup-50">
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-lup-900 mb-8">❤️ Favoritos</h1>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <LupAdCard key={ad.id} ad={ad} isFavorite={true} isLoggedIn={true} photo={photosMap[ad.id]} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-lup-200">
              <p className="text-lup-700 text-lg mb-4">Ainda não guardaste nenhum anúncio</p>
              <Link href="/lup">
                <button className="bg-lup-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-lup-600">
                  Explorar o Lup
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
