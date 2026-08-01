import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactSellerForm from "@/components/mercado-da-terra/contact-seller-form";
import FavoriteButton from "@/components/mercado-da-terra/favorite-button";

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

  const { data: photos } = await supabase
    .from("marketplace_photos")
    .select("*")
    .eq("ad_id", ad.id)
    .order("sort_order", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Verificar se este anúncio é favorito do utilizador
  let isFav = false;
  if (user) {
    const { data: fav } = await supabase
      .from("marketplace_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("ad_id", ad.id)
      .maybeSingle();
    isFav = !!fav;
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-terra-200 p-8">
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

          {/* GALERIA */}
          {photos && photos.length > 0 && (
            <div className="mb-6">
              <div className="mb-3">
                <img
                  src={photos[0].storage_path}
                  alt={ad.title}
                  className="w-full h-96 object-cover rounded-lg border border-terra-200"
                />
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {photos.map((photo: any) => (
                    <img
                      key={photo.id}
                      src={photo.storage_path}
                      alt={`Foto ${photo.sort_order + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-terra-200 cursor-pointer hover:border-terra-600"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preço / Troca / Procura */}
          {ad.type === 'troca' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-600 font-semibold mb-1">💱 Pretendo Receber</p>
              <p className="text-lg text-blue-900">{ad.details?.seeking || 'Não especificado'}</p>
              {ad.details?.seeking_description && (
                <p className="text-sm text-blue-800 mt-2">{ad.details.seeking_description}</p>
              )}
            </div>
          ) : ad.type === 'procura' ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-600 font-semibold mb-1">🔍 O que Procuro</p>
              <p className="text-lg text-purple-900">{ad.details?.seeking || 'Não especificado'}</p>
              {ad.details?.seeking_description && (
                <p className="text-sm text-purple-800 mt-2">{ad.details.seeking_description}</p>
              )}
            </div>
          ) : (
            <div className="text-2xl font-bold text-terra-700 mb-6">
              {ad.price_type === 'free' || ad.price == null ? 'Grátis' : '€' + ad.price.toFixed(2)}
              {ad.price_type === 'negotiable' && ad.price != null && ' (negociável)'}
            </div>
          )}

          {/* Descrição */}
          <div className="mb-8 pb-8 border-b border-terra-200">
            <h2 className="text-lg font-semibold text-terra-900 mb-3">Descrição</h2>
            <p className="text-terra-700 whitespace-pre-wrap">{ad.description}</p>
          </div>

          {/* Info */}
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
              <p className="font-semibold text-terra-900">👁️ {ad.views_count || 0}</p>
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
          <div className="bg-terra-50 p-6 rounded-lg mb-6">
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

          {/* Botões / Contactar / Guardar */}
          <div className="flex flex-col md:flex-row gap-3">
            <ContactSellerForm
              adId={ad.id}
              sellerId={ad.author_id}
              currentUserId={user?.id}
            />
            <FavoriteButton adId={ad.id} isFavorite={isFav} isLoggedIn={!!user} variant="detail" />
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
