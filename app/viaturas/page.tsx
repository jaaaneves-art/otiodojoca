import { createClient } from "@/lib/supabase/server";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import ViaturasFiltros from "@/components/viaturas/viaturas-filtros";
import { ViaturasResultados } from "@/components/viaturas/viaturas-resultados";

interface SearchParams {
  q?: string;
  marca?: string;
  category?: string;
  type?: string;
  min?: string;
  max?: string;
  anoMin?: string;
  kmMax?: string;
  combustivel?: string;
  caixa?: string;
  sort?: string;
}

export default async function ViaturasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketplace_ads")
    .select("*")
    .eq("module", "viaturas")
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

  // Filtros sobre campos guardados em details (jsonb) — sem índice dedicado
  // nesta primeira versão (ver docs/VIATURAS.md, secção 8), por isso
  // aplicados em memória depois de ir buscar os anúncios ativos. Se o
  // volume crescer muito, vale a pena promover isto a colunas reais ou
  // criar um índice GIN.
  let ads = adsRaw || [];
  if (params.anoMin) {
    const anoMin = parseInt(params.anoMin);
    ads = ads.filter((a) => a.details?.ano && Number(a.details.ano) >= anoMin);
  }
  if (params.kmMax) {
    const kmMax = parseInt(params.kmMax);
    ads = ads.filter((a) => a.details?.quilometros != null && Number(a.details.quilometros) <= kmMax);
  }
  if (params.combustivel) {
    ads = ads.filter((a) => a.details?.combustivel === params.combustivel);
  }
  if (params.caixa) {
    ads = ads.filter((a) => a.details?.caixa === params.caixa);
  }
  if (params.marca) {
    const marca = params.marca.toLowerCase();
    ads = ads.filter((a) => a.details?.marca?.toLowerCase() === marca);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "viaturas")
    .order("sort_order");

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

  // Coordenadas para a vista de mapa: o campo `location` de cada anúncio é
  // gravado pelo MunicipioAutocomplete como "Nome, Distrito" (ver
  // components/mercado-da-terra/municipio-autocomplete.tsx) — cruza-se
  // diretamente com `municipios.nome + ", " + municipios.distrito_regiao`,
  // que já tem latitude/longitude. Sem geocodificação nova nem tabela nova.
  const { data: municipiosGeo } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const coordsPorLocalizacao = new Map<string, { lat: number; lon: number }>();
  municipiosGeo?.forEach((m: any) => {
    coordsPorLocalizacao.set(`${m.nome}, ${m.distrito_regiao}`, {
      lat: Number(m.latitude),
      lon: Number(m.longitude),
    });
  });

  const adsComCoords = ads.map((ad) => {
    const coords = ad.location ? coordsPorLocalizacao.get(ad.location) : undefined;
    return {
      ...ad,
      auction: auctionsMap[ad.id] ?? null,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
    };
  });

  const hasFilters = !!(
    params.q || params.marca || params.category || params.type || params.min || params.max ||
    params.anoMin || params.kmMax || params.combustivel || params.caixa ||
    (params.sort && params.sort !== "recentes")
  );

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <ViaturasFiltros categories={categories || []} />

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-viaturas-900">
              {hasFilters ? `Resultados (${ads.length})` : `Anúncios (${ads.length})`}
            </h3>
          </div>

          {ads.length > 0 ? (
            <ViaturasResultados
              ads={adsComCoords}
              favoriteIds={Array.from(favoriteIds)}
              isLoggedIn={!!user}
              photosMap={photosMap}
            />
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-viaturas-200">
              <p className="text-viaturas-700 text-lg">
                {hasFilters ? "Nenhuma viatura encontrada com estes filtros" : "Ainda não há viaturas anunciadas"}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
