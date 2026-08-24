import { createClient } from "@/lib/supabase/server";
import ImoveisNavbar from "@/components/imoveis/imoveis-navbar";
import ImoveisFiltros from "@/components/imoveis/imoveis-filtros";
import { ImovelAdCard } from "@/components/imoveis/imoveis-ad-card";

interface SearchParams {
  q?: string;
  category?: string;
  type?: string;
  min?: string;
  max?: string;
  quartos?: string;
  sort?: string;
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketplace_ads")
    .select("*")
    .eq("module", "imoveis")
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

  const { data: adsRaw } = await query;

  // Quartos mínimo: filtrado em memória porque vive em details (jsonb), não
  // numa coluna própria — mesma razão por que o Gran Bazar filtra "seeking"
  // (troca) do lado do cliente em vez de no query builder.
  const ads = params.quartos
    ? (adsRaw || []).filter((a) => (a.details?.bedrooms ?? 0) >= parseInt(params.quartos!))
    : adsRaw || [];

  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "imoveis")
    .order("sort_order");

  const categoryNameMap: Record<number, string> = {};
  (categories || []).forEach((c: any) => { categoryNameMap[c.id] = c.name; });

  const adIds = ads.map((a) => a.id);

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

  const hasFilters = !!(params.q || params.category || params.type || params.min || params.max || params.quartos || (params.sort && params.sort !== "recentes"));

  return (
    <>
      <ImoveisNavbar />
      <div className="min-h-screen bg-imoveis-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <ImoveisFiltros categories={categories || []} />

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-imoveis-900">
              {hasFilters ? `Resultados (${ads.length})` : `Imóveis (${ads.length})`}
            </h3>
          </div>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <ImovelAdCard
                  key={ad.id}
                  ad={{ ...ad, auction: auctionsMap[ad.id] ?? null }}
                  isFavorite={favoriteIds.has(ad.id)}
                  isLoggedIn={!!user}
                  photo={photosMap[ad.id]}
                  categoryName={categoryNameMap[ad.category_id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-imoveis-200">
              <p className="text-imoveis-700 text-lg">
                {hasFilters ? "Nenhum imóvel encontrado com estes filtros" : "Ainda não há imóveis publicados"}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
