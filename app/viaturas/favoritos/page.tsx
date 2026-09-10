import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { ViaturaAdCard } from "@/components/viaturas/viatura-ad-card";
import { ArrowRight, Heart } from "lucide-react";

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
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <header className="mb-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">A tua seleção</p><div className="mt-2 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Heart size={23} fill="currentColor" /></span><div><h1 className="text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">Viaturas guardadas</h1><p className="mt-1 text-sm text-slate-600">Compara com calma e volta aos anúncios que mais te interessam.</p></div></div></header>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500"><Heart size={25} /></span>
              <h2 className="mt-5 text-xl font-black text-slate-950">Ainda não guardaste nenhuma viatura</h2>
              <p className="mt-2 text-sm text-slate-500">Usa o coração nos anúncios para criares a tua lista.</p>
              <Link href="/viaturas" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500">Explorar o StandGo <ArrowRight size={17} /></Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
