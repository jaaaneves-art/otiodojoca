import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function FeiraPage() {
  const supabase = createClient();

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Header */}
      <nav className="bg-white border-b border-terra-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-terra-800">🌾 Mercado da Terra</h1>
          <div className="flex gap-3">
            {user && (
              <>
                <Link href="/mercado-da-terra/meus-anuncios">
                  <button className="border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50">
                    Meus Anúncios
                  </button>
                </Link>
                <Link href="/mercado-da-terra/novo">
                  <button className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700">
                    + Novo Anúncio
                  </button>
                </Link>
              </>
            )}
            {!user && (
              <Link href="/login">
                <button className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700">
                  Entrar
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Título e Descrição */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-terra-900 mb-2">Bem-vindo ao Mercado da Terra</h2>
          <p className="text-terra-600 text-lg">Compra, vende ou troca produtos locais, agrícolas e artesanais</p>
        </div>

        {/* Categorias */}
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

        {/* Listagem de Anúncios */}
        <div>
          <h3 className="text-xl font-semibold text-terra-800 mb-4">
            Anúncios Recentes ({ads?.length || 0})
          </h3>

          {ads && ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad: any) => (
                <Link key={ad.id} href={`/mercado-da-terra/${ad.id}`}>
                  <div className="bg-white rounded-lg border border-terra-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
                    {/* Imagem Placeholder */}
                    <div className="w-full h-40 bg-terra-100 flex items-center justify-center text-4xl">
                      {ad.category === "Produtos Agrícolas" && "🌾"}
                      {ad.category === "Animais e Pecuária" && "🐄"}
                      {ad.category === "Produtos Alimentares" && "🍖"}
                      {ad.category === "Artesanato Rural" && "🏺"}
                      {ad.category === "Maquinaria Agrícola" && "🚜"}
                      {ad.category === "Sementes e Mudas" && "🌱"}
                      {ad.category === "Experiências Rurais" && "🎓"}
                      {!ad.category && "📦"}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-terra-500 uppercase tracking-wide mb-2">{ad.category}</p>
                        <h3 className="font-semibold text-terra-800 line-clamp-2 mb-2">{ad.title}</h3>
                        <p className="text-sm text-terra-600 line-clamp-2 mb-3">{ad.description}</p>
                      </div>

                      {/* Footer */}
                      <div>
                        <p className="text-lg font-bold text-terra-700 mb-2">
                          {ad.price_type === "free" ? "Grátis" : `€${ad.price?.toFixed(2)}`}
                          {ad.price_type === "negotiable" && " (neg.)"}
                        </p>
                        <p className="text-xs text-terra-500">📍 {ad.municipality}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
              <p className="text-terra-600 text-lg mb-4">Nenhum anúncio disponível ainda</p>
              {user && (
                <Link href="/mercado-da-terra/novo">
                  <button className="bg-terra-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-terra-700">
                    Ser o Primeiro a Publicar
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}