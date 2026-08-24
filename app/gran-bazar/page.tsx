import { createClient } from "@/lib/supabase/server";
import GranBazarNavbar from "@/components/gran-bazar/gran-bazar-navbar";
import GranBazarFiltros from "@/components/gran-bazar/gran-bazar-filtros";
import { BazarAdCard } from "@/components/gran-bazar/bazar-ad-card";

interface SearchParams {
  q?: string;
  category?: string;
  type?: string;
  min?: string;
  max?: string;
  sort?: string;
}

export default async function GranBazarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketplace_ads")
    .select("*")
    .eq("module", "gran-bazar")
    .eq("status", "active");

  if (params.type) {
    query = query.eq("type", params.type);
  }
  if (params.category) {
    query = query.eq("category_id", parseInt(params.category));
  }
  if (params.min) {
    query = query.gte("price", parseFloat(params.min));
  }
  if (params.max) {
    query = query.lte("price", parseFloat(params.max));
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  switch (params.sort) {
    case "preco-asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "preco-desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: ads } = await query;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "bazar")
    .order("sort_order");

  const adIds = (ads || []).map((a) => a.id);

  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: allPhotos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    allPhotos?.forEach((photo: any) => {
      if (!photosMap[photo.ad_id]) photosMap[photo.ad_id] = photo.storage_path;
    });
  }

  const favoriteIds = new Set<number>();
  if (user && adIds.length > 0) {
    const { data: favs } = await supabase
      .from("marketplace_favorites")
      .select("ad_id")
      .eq("user_id", user.id)
      .in("ad_id", adIds);
    favs?.forEach((f: any) => favoriteIds.add(f.ad_id));
  }

  const auctionsMap: Record<number, { current_price: number; ends_at: string; starts_at: string; status: string }> = {};
  const auctionAdIds = (ads || []).filter((a) => a.type === "leilao").map((a) => a.id);
  if (auctionAdIds.length > 0) {
    const { data: auctionsData } = await supabase
      .from("marketplace_auctions")
      .select("ad_id, current_price, ends_at, starts_at, status")
      .in("ad_id", auctionAdIds);
    auctionsData?.forEach((a: any) => {
      auctionsMap[a.ad_id] = { current_price: a.current_price, ends_at: a.ends_at, starts_at: a.starts_at, status: a.status };
    });
  }

  const hasFilters = !!(params.q || params.category || params.type || params.min || params.max || (params.sort && params.sort !== "recentes"));

  return (
    <>
      <GranBazarNavbar />
      <div className="min-h-screen bg-bazar-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <GranBazarFiltros categories={categories || []} />

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-bazar-900">
              {hasFilters ? `Resultados (${ads?.length || 0})` : `Anúncios (${ads?.length || 0})`}
            </h3>
          </div>

          {ads && ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <BazarAdCard
                  key={ad.id}
                  ad={{ ...ad, auction: auctionsMap[ad.id] ?? null }}
                  isFavorite={favoriteIds.has(ad.id)}
                  isLoggedIn={!!user}
                  photo={photosMap[ad.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-bazar-200">
              <p className="text-bazar-700 text-lg">
                {hasFilters ? "Nenhum anúncio encontrado com estes filtros" : "Ainda não há anúncios nesta categoria"}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
