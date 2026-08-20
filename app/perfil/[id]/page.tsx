import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PerfilPublicoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Buscar o perfil público (só campos públicos)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, location, avatar_url, reputation, created_at")
    .eq("id", params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Utilizador atual (para saber se é o próprio perfil)
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  // Anúncios ativos deste vendedor
  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Primeira foto de cada anúncio
  const adIds = (ads || []).map((a: any) => a.id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((p: any) => {
      if (!photosMap[p.ad_id]) photosMap[p.ad_id] = p.storage_path;
    });
  }

  const displayName = profile.display_name || profile.username || "Utilizador";
  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-PT", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
        </div>

        {/* Cabeçalho do perfil */}
        <div className="bg-white rounded-lg border border-terra-200 p-6 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border border-terra-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-terra-100 flex items-center justify-center text-4xl">
                👤
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-terra-900">{displayName}</h1>
                  {profile.username && profile.display_name && (
                    <p className="text-terra-500">@{profile.username}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <Link href="/perfil/editar">
                    <button className="border border-terra-200 text-terra-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-terra-50">
                      Editar Perfil
                    </button>
                  </Link>
                )}
              </div>

              {/* Metadados */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-terra-600">
                <span>⭐ Reputação: <span className="font-semibold text-terra-800">{profile.reputation ?? 0}</span></span>
                {profile.location && <span>📍 {profile.location}</span>}
                <span>📅 Membro desde {memberSince}</span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-terra-700 whitespace-pre-wrap">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Anúncios do vendedor */}
        <div>
          <h2 className="text-xl font-semibold text-terra-800 mb-4">
            Anúncios ativos ({ads?.length || 0})
          </h2>

          {ads && ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad: any) => {
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
                        <h3 className="font-semibold text-terra-800 line-clamp-2 mb-2">{ad.title}</h3>
                        <div>
                          <p className="text-lg font-bold text-terra-700 mb-1">
                            {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-terra-500">📍 {ad.location}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-terra-200">
              <p className="text-terra-600">Este vendedor não tem anúncios ativos de momento</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
