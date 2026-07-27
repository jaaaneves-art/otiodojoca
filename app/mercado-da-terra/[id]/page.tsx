import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select(`
      *,
      author:profiles(id, username, avatar_url)
    `)
    .eq("id", params.id)
    .single();

  if (error || !ad) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-terra-200 p-8">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-terra-900">{ad.title}</h1>
              <p className="text-terra-600 mt-2">{ad.category}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              ad.status === 'active' ? 'bg-green-100 text-green-700' :
              ad.status === 'sold' ? 'bg-gray-100 text-gray-600' :
              'bg-terra-100 text-terra-600'
            }`}>
              {ad.status === 'active' ? 'Ativo' :
               ad.status === 'sold' ? 'Vendido' : 'Indisponível'}
            </span>
          </div>

          {/* Preço */}
          <div className="text-2xl font-bold text-terra-700 mb-6">
            {ad.price_type === 'free' ? 'Grátis' : `€${ad.price?.toFixed(2)}`}
            {ad.price_type === 'negotiable' && ' (negociável)'}
          </div>

          {/* Descrição */}
          <div className="mb-8 pb-8 border-b border-terra-200">
            <h2 className="text-lg font-semibold text-terra-900 mb-3">Descrição</h2>
            <p className="text-terra-700 whitespace-pre-wrap">{ad.description}</p>
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-terra-200">
            <div>
              <p className="text-sm text-terra-600">Localização</p>
              <p className="font-semibold text-terra-900">📍 {ad.location}</p>
            </div>
            <div>
              <p className="text-sm text-terra-600">Data de Publicação</p>
              <p className="font-semibold text-terra-900">{new Date(ad.created_at).toLocaleDateString('pt-PT')}</p>
            </div>
            <div>
              <p className="text-sm text-terra-600">Visualizações</p>
              <p className="font-semibold text-terra-900">👁️ {ad.views_count}</p>
            </div>
            <div>
              <p className="text-sm text-terra-600">Contacto</p>
              <p className="font-semibold text-terra-900">
                {ad.contact_method === 'message' ? '💬 Mensagem' :
                 ad.contact_method === 'phone' ? '📞 Telefone' :
                 ad.contact_method === 'email' ? '📧 Email' : '🤝 Presencial'}
              </p>
            </div>
          </div>

          {/* Vendedor */}
          <div className="bg-terra-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-terra-900 mb-4">Vendedor</h2>
            {ad.author ? (
              <div className="flex items-center gap-4">
                {ad.author.avatar_url && (
                  <img src={ad.author.avatar_url} alt={ad.author.username} className="w-16 h-16 rounded-full" />
                )}
                <div>
                  <p className="font-semibold text-terra-900">{ad.author.username}</p>
                  <Link href={`/perfil/${ad.author.id}`} className="text-terra-600 hover:text-terra-800">
                    Ver Perfil →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-terra-600">Utilizador não encontrado</p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="mt-8 flex gap-3">
            <button className="flex-1 bg-terra-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-terra-700">
              💬 Enviar Mensagem
            </button>
            <Link href="/mercado-da-terra" className="flex-1">
              <button className="w-full border border-terra-200 text-terra-700 font-medium py-3 px-4 rounded-lg hover:bg-terra-50">
                Voltar à Lista
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
