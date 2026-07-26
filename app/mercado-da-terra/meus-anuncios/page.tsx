import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MeusAnunciosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const activeAds = ads?.filter(ad => ad.status === "active") || [];
  const soldAds = ads?.filter(ad => ad.status === "sold") || [];
  const otherAds = ads?.filter(ad => !["active", "sold"].includes(ad.status)) || [];

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
          <Link href="/mercado-da-terra/novo">
            <button className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700">
              + Novo Anúncio
            </button>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Meus Anúncios</h1>
        <p className="text-terra-600 mb-8">Gerencia todos os teus anúncios</p>

        {/* Anúncios Ativos */}
        {activeAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Ativos ({activeAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAds.map((ad) => (
                <div key={ad.id} className="bg-white p-4 rounded-lg border border-terra-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-terra-800">{ad.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Ativo</span>
                  </div>
                  <p className="text-sm text-terra-600 mb-2">{ad.category}</p>
                  <p className="text-lg font-bold text-terra-700 mb-3">
                    {ad.price_type === 'free' ? 'Grátis' : `€${ad.price?.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-terra-500 mb-4">📍 {ad.municipality}</p>
                  <div className="flex gap-2">
                    <Link href={`/mercado-da-terra/${ad.id}`} className="flex-1">
                      <button className="w-full text-sm border border-terra-200 text-terra-700 py-2 rounded hover:bg-terra-50">
                        Ver
                      </button>
                    </Link>
                    <Link href={`/mercado-da-terra/editar/${ad.id}`} className="flex-1"><button className="w-full text-sm bg-terra-100 text-terra-700 py-2 rounded hover:bg-terra-200">Editar</button></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anúncios Vendidos */}
        {soldAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Vendidos ({soldAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldAds.map((ad) => (
                <div key={ad.id} className="bg-white p-4 rounded-lg border border-terra-200 opacity-60">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-terra-800">{ad.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Vendido</span>
                  </div>
                  <p className="text-sm text-terra-600 mb-2">{ad.category}</p>
                  <p className="text-lg font-bold text-terra-700 mb-3">
                    €{ad.price?.toFixed(2)}
                  </p>
                  <p className="text-sm text-terra-500">📍 {ad.municipality}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem Anúncios */}
        {ads && ads.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
            <p className="text-terra-600 text-lg mb-4">Ainda não tens nenhum anúncio publicado</p>
            <Link href="/mercado-da-terra/novo">
              <button className="bg-terra-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-terra-700">
                Publicar Primeiro Anúncio
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

