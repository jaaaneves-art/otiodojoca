import { createClient } from "@/lib/supabase/server";
import LupNavbar from "@/components/lup/lup-navbar";
import LupFiltros from "@/components/lup/lup-filtros";
import { LupAdCard } from "@/components/lup/lup-ad-card";
import { LupEmptyState, lupMainClass, lupPageClass } from "@/components/lup/lup-ui";
import { LayoutGrid } from "lucide-react";

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
      <div className={lupPageClass}>
        <main className={lupMainClass}>
          <LupFiltros categories={categories || []} />

          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-lup-950 sm:text-xl">
              <LayoutGrid className="h-5 w-5 text-lup-600" />
              {hasFilters ? `Resultados (${ads.length})` : `Anúncios (${ads.length})`}
            </h2>
            <p className="hidden text-xs font-semibold uppercase tracking-wider text-lup-600 sm:block">Da comunidade, para a comunidade</p>
          </div>

          {ads.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
            <LupEmptyState
              title={hasFilters ? "Não encontrámos correspondências" : "O primeiro ciclo começa aqui"}
              description={hasFilters ? "Experimenta alterar a pesquisa ou limpar os filtros para veres mais anúncios." : "Publica o primeiro excedente e ajuda a pôr os recursos da tua comunidade novamente em circulação."}
              href={hasFilters ? "/lup" : "/lup/novo"}
              actionLabel={hasFilters ? "Limpar pesquisa" : "Publicar um anúncio"}
            />
          )}
        </main>
      </div>
    </>
  );
}
