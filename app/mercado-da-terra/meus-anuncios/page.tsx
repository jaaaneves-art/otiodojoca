import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { markAsSold, markAsInactive, reactivate } from "@/app/mercado-da-terra/actions";

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

  const activeAds = ads?.filter(ad => ad.status === "active") || [];
  const soldAds = ads?.filter(ad => ad.status === "sold") || [];
  const inactiveAds = ads?.filter(ad => ad.status === "inactive") || [];

  const markSoldAction = async (formData: FormData) => {
    "use server";
    const id = parseInt(formData.get("adId") as string);
    await markAsSold(id);
  };

  const markInactiveAction = async (formData: FormData) => {
    "use server";
    const id = parseInt(formData.get("adId") as string);
    await markAsInactive(id);
  };

  const reactivateAction = async (formData: FormData) => {
    "use server";
    const id = parseInt(formData.get("adId") as string);
    await reactivate(id);
  };

  const renderCard = (ad: any, statusLabel: string, statusColor: string, opacity: string = "") => {
    const firstPhoto = photosMap[ad.id];
    return (
      <div key={ad.id} className={`bg-white rounded-lg border border-terra-200 hover:shadow-md transition overflow-hidden ${opacity}`}>
        {firstPhoto ? (
          <div className="w-full h-40 bg-terra-100">
            <img src={firstPhoto} alt={ad.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-40 bg-terra-100 flex items-center justify-center text-4xl">
            📦
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-terra-800">{ad.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-sm text-terra-600 mb-2">Categoria: {ad.category_id}</p>
          <p className="text-lg font-bold text-terra-700 mb-2">
            {ad.price_type === "free" || ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
          </p>
          <p className="text-sm text-terra-500 mb-4">📍 {ad.location}</p>

          <div className="flex gap-2 mb-2">
            <Link href={`/mercado-da-terra/${ad.id}`} className="flex-1">
              <button className="w-full bg-terra-100 text-terra-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-terra-200">
                Ver
              </button>
            </Link>
            <Link href={`/mercado-da-terra/editar/${ad.id}`} className="flex-1">
              <button className="w-full bg-terra-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-terra-700">
                ✏️ Editar
              </button>
            </Link>
          </div>

          {ad.status === "active" && (
            <div className="flex gap-2">
              <form action={markSoldAction} className="flex-1">
                <input type="hidden" name="adId" value={ad.id} />
                <button type="submit" className="w-full bg-green-100 text-green-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-green-200">
                  ✓ Vendido
                </button>
              </form>
              <form action={markInactiveAction} className="flex-1">
                <input type="hidden" name="adId" value={ad.id} />
                <button type="submit" className="w-full bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-200">
                  ⏸️ Desativar
                </button>
              </form>
            </div>
          )}

          {(ad.status === "sold" || ad.status === "inactive") && (
            <form action={reactivateAction}>
              <input type="hidden" name="adId" value={ad.id} />
              <button type="submit" className="w-full bg-terra-100 text-terra-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-terra-200">
                🔄 Reativar
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Meus Anúncios</h1>
        <p className="text-terra-600 mb-8">Gerencia todos os teus anúncios</p>

        {activeAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              🟢 Anúncios Ativos ({activeAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAds.map(ad => renderCard(ad, "Ativo", "bg-green-100 text-green-700"))}
            </div>
          </div>
        )}

        {soldAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              ✓ Anúncios Vendidos ({soldAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldAds.map(ad => renderCard(ad, "Vendido", "bg-green-100 text-green-700", "opacity-75"))}
            </div>
          </div>
        )}

        {inactiveAds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              ⏸️ Anúncios Inativos ({inactiveAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveAds.map(ad => renderCard(ad, "Inativo", "bg-gray-100 text-gray-600", "opacity-60"))}
            </div>
          </div>
        )}

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