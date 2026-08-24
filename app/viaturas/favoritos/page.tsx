import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { ViaturaAdCard } from "@/components/viaturas/viatura-ad-card";

export default async function FavoritosViaturasPage() {
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
      .select("*")
      .in("id", favAdIds)
      .eq("module", "viaturas");
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

  const auctionsMap: Record<number, { current_price: number; ends_at: string; starts_at: string; status: string }> = {};
  const auctionAdIds = ads.filter((a) => a.type === "leilao").map((a) => a.id);
  if (auctionAdIds.length > 0) {
    const { data: auctionsData } = await supabase
      .from("marketplace_auctions")
      .select("ad_id, current_price, ends_at, starts_at, status")
      .in("ad_id", auctionAdIds);
    auctionsData?.forEach((a: any) => {
      auctionsMap[a.ad_id] = { current_price: a.current_price, ends_at: a.ends_at, starts_at: a.starts_at, status: a.status };
    });
  }

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-viaturas-900 mb-8">❤️ Favoritos</h1>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <ViaturaAdCard
                  key={ad.id}
                  ad={{ ...ad, auction: auctionsMap[ad.id] ?? null }}
                  isFavorite={true}
                  isLoggedIn={true}
                  photo={photosMap[ad.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-viaturas-200">
              <p className="text-viaturas-700 text-lg mb-4">Ainda não guardaste nenhuma viatura</p>
              <Link href="/viaturas">
                <button className="bg-viaturas-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-viaturas-700">
                  Explorar o StandGo
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
