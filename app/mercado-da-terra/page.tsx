import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MarketplaceFiltros from "@/components/mercado-da-terra/marketplace-filtros";

interface SearchParams {
  q?: string;
  category?: string;
  location?: string;
  min?: string;
  max?: string;
  type?: string;
}

export default async function FeiraPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from("marketplace_ads")
    .select("*")
    .eq("status", "active");

  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }
  if (searchParams.category) {
    query = query.eq("category_id", parseInt(searchParams.category));
  }
  if (searchParams.location) {
    query = query.eq("location", searchParams.location);
  }
  if (searchParams.min) {
    query = query.gte("price", parseFloat(searchParams.min));
  }
  if (searchParams.max) {
    query = query.lte("price", parseFloat(searchParams.max));
  }
  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%`);
  }

  const { data: ads } = await query.order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  const { data: allPhotos } = await supabase
    .from("marketplace_photos")
    .select("ad_id, storage_path, sort_order")
    .order("sort_order", { ascending: true });

  const photosMap: Record<number, string> = {};
  if (allPhotos) {
    allPhotos.forEach((photo: any) => {
      if (!photosMap[photo.ad_id]) {
        photosMap[photo.ad_id] = photo.storage_path;
      }
    });
  }

  const vendaAds = ads?.filter(ad => ad.type === "sale") || [];
  const ofertaAds = ads?.filter(ad => ad.type === "offer") || [];
  const procuraAds = ads?.filter(ad => ad.type === "troca") || [];
  const trocaAds = ads?.filter(ad => ad.type === "procura") || [];

  const hasFilters = !!(searchParams.q || searchParams.category || searchParams.location || searchParams.min || searchParams.max || searchParams.type);
  const totalResults = ads?.length || 0;

  const renderAdCard = (ad: any, showSecondary?: boolean) => {
    const firstPhoto = photosMap[ad.id];

    return (
      <Link key={ad.id} href={`/mercado-da-terra/${ad.id}`}>
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
            <div>
              <p className="text-xs text-terra-500 uppercase tracking-wide mb-2">{ad.category}</p>
              {showSecondary ? (
                <>
                  <h3 className="font-semibold text-terra-800 line-clamp-2 mb-2">
                    🔍 {ad.details?.seeking || ad.title}
                  </h3>
                  <p className="text-sm text-terra-600 line-clamp-2 mb-3">{ad.details?.seeking_description}</p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-terra-800 line-clamp-2 mb-2">{ad.title}</h3>
                  <p className="text-sm text-terra-600 line-clamp-2 mb-3">{ad.description}</p>
                </>
              )}
            </div>

            <div>
              {(ad.type === "sale" || ad.type === "troca") ? (
                <p className="text-lg font-bold text-terra-700 mb-2">
                  {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                  {ad.price_type === "negotiable" && ad.price != null && " (neg.)"}
                </p>
              ) : (
                <p className="text-lg font-bold text-terra-700 mb-2">Grátis</p>
              )}
              <p className="text-xs text-terra-500">📍 {ad.location}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const EmptySection = () => (
    <div className="text-center py-8 bg-terra-50 rounded-lg border border-terra-200">
      <p className="text-terra-600">Nenhum anúncio disponível</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-terra-900 mb-2">Bem-vindo ao Mercado da Terra</h2>
          <p className="text-terra-600 text-lg">Compra, vende ou troca produtos locais, agrícolas e artesanais</p>
        </div>

        <MarketplaceFiltros
          categories={categories || []}
          municipios={municipios || []}
        />

        {hasFilters ? (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-terra-800 mb-4">
              Resultados ({totalResults})
            </h3>
            {totalResults > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads?.map(ad => renderAdCard(ad))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
                <p className="text-terra-600 text-lg">Nenhum anúncio encontrado com estes filtros</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h3 className="text-lg font-semibold text-terra-800 mb-4">Categorias</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/mercado-da-terra">
                  <div className="bg-white p-4 rounded-lg border border-terra-200 hover:shadow-md transition text-center cursor-pointer">
                    <p className="text-2xl mb-2">🌾</p>
                    <p className="font-medium text-terra-800">Produtos Agrícolas</p>
                  </div>
                </Link>
                <Link href="/mercado-da-terra">
                  <div className="bg-white p-4 rounded-lg border border-terra-200 hover:shadow-md transition text-center cursor-pointer">
                    <p className="text-2xl mb-2">🐄</p>
                    <p className="font-medium text-terra-800">Animais</p>
                  </div>
                </Link>
                <Link href="/mercado-da-terra">
                  <div className="bg-white p-4 rounded-lg border border-terra-200 hover:shadow-md transition text-center cursor-pointer">
                    <p className="text-2xl mb-2">🍖</p>
                    <p className="font-medium text-terra-800">Alimentares</p>
                  </div>
                </Link>
                <Link href="/mercado-da-terra">
                  <div className="bg-white p-4 rounded-lg border border-terra-200 hover:shadow-md transition text-center cursor-pointer">
                    <p className="text-2xl mb-2">🏺</p>
                    <p className="font-medium text-terra-800">Artesanato</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold text-terra-800 mb-4">💰 Venda ({vendaAds.length})</h3>
              {vendaAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendaAds.map(ad => renderAdCard(ad))}
                </div>
              ) : (
                <EmptySection />
              )}
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold text-terra-800 mb-4">🎁 Oferta ({ofertaAds.length})</h3>
              {ofertaAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ofertaAds.map(ad => renderAdCard(ad))}
                </div>
              ) : (
                <EmptySection />
              )}
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold text-terra-800 mb-4">🔍 Procura ({procuraAds.length})</h3>
              {procuraAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {procuraAds.map(ad => renderAdCard(ad))}
                </div>
              ) : (
                <EmptySection />
              )}
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-semibold text-terra-800 mb-4">🔄 Troca ({trocaAds.length})</h3>
              {trocaAds.length > 0 ? (
                <>
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-terra-700 mb-3">Há</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {trocaAds.map(ad => renderAdCard(ad, false))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-terra-700 mb-3">Que se busca</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {trocaAds.map(ad => renderAdCard(ad, true))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptySection />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}