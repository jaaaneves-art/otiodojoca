import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LupNavbar from "@/components/lup/lup-navbar";
import { LupAdCard } from "@/components/lup/lup-ad-card";
import { Heart } from "lucide-react";
import { LupEmptyState, LupPageHeader, lupMainClass, lupPageClass } from "@/components/lup/lup-ui";

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
      <div className={lupPageClass}>
        <main className={lupMainClass}>
          <LupPageHeader eyebrow="A tua seleção" title="Anúncios guardados" description="Tudo o que queres acompanhar, reunido num só lugar." icon={Heart} />

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {ads.map((ad) => (
                <LupAdCard key={ad.id} ad={ad} isFavorite={true} isLoggedIn={true} photo={photosMap[ad.id]} />
              ))}
            </div>
          ) : (
            <LupEmptyState title="Ainda não guardaste nada" description="Quando encontrares algo interessante, toca no coração para o guardares aqui." href="/lup" actionLabel="Explorar o LUP" />
          )}
        </main>
      </div>
    </>
  );
}
