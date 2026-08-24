import { createClient } from "@/lib/supabase/server";
import LupNavbar from "@/components/lup/lup-navbar";
import LupFiltros from "@/components/lup/lup-filtros";
import { LupAdCard } from "@/components/lup/lup-ad-card";

interface SearchParams {
  q?: string;
  category?: string;
  type?: string;
  sort?: string;
}

export default async function LupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketplace_ads")
    .select("*, category:categories(name, slug)")
    .eq("module", "lup")
    .eq("status", "active");

  if (params.type) {
    query = query.eq("type", params.type);
  }
  if (params.category) {
    query = query.eq("category_id", parseInt(params.category));
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data: adsData } = await query;
  let ads = adsData || [];

  // Ordenar por prazo de recolha mais próximo é feito em memória: o prazo
  // vive dentro de details (jsonb), e o volume de anúncios de um módulo
  // como este não justifica lidar com ordenação por caminho jsonb na
  // query (mesma decisão pragmática que o Gran Bazar toma ao carregar
  // todos os anúncios ativos de uma vez — ver docs/GRAN-BAZAR.md, secção
  // "Limitações conhecidas").
  if (params.sort === "recolha") {
    ads = [...ads].sort((a: any, b: any) => {
      const da = a.details?.pickup_ends_at ? new Date(a.details.pickup_ends_at).getTime() : Infinity;
      const db = b.details?.pickup_ends_at ? new Date(b.details.pickup_ends_at).getTime() : Infinity;
      return da - db;
    });
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("type", "lup")
    .order("sort_order");

  const adIds = ads.map((a: any) => a.id);

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

  const hasFilters = !!(params.q || params.category || params.type || (params.sort && params.sort !== "recentes"));

  return (
    <>
      <LupNavbar />
      <div className="min-h-screen bg-lup-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <LupFiltros categories={categories || []} />

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-lup-900">
              {hasFilters ? `Resultados (${ads.length})` : `Anúncios (${ads.length})`}
            </h3>
          </div>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad: any) => (
                <LupAdCard
                  key={ad.id}
                  ad={ad}
                  isFavorite={favoriteIds.has(ad.id)}
                  isLoggedIn={!!user}
                  photo={photosMap[ad.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-lup-200">
              <p className="text-lup-700 text-lg">
                {hasFilters ? "Nenhum anúncio encontrado com estes filtros" : "Ainda não há anúncios no Lup"}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
