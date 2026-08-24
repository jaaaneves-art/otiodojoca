import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { VIATURAS_AD_TYPES } from "@/lib/viaturas/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", active: "Ativo", reserved: "Reservado", sold: "Vendido",
  expired: "Expirado", cancelled: "Cancelado", inactive: "Indisponível",
};

export default async function MeusAnunciosViaturasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", user.id)
    .eq("module", "viaturas")
    .order("created_at", { ascending: false });

  const activeAds = ads?.filter((ad) => ad.status === "active") || [];
  const encerradosAds = ads?.filter((ad) => ["sold", "expired", "cancelled"].includes(ad.status)) || [];

  const adIds = (ads || []).map((ad) => ad.id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((photo: any) => {
      if (!photosMap[photo.ad_id]) photosMap[photo.ad_id] = photo.storage_path;
    });
  }

  const renderCard = (ad: any, faded?: boolean) => {
    const d = ad.details ?? {};
    return (
      <Link key={ad.id} href={`/viaturas/${ad.id}`}>
        <div className={`bg-white rounded-lg border border-viaturas-200 hover:shadow-md transition cursor-pointer h-full overflow-hidden ${faded ? "opacity-60" : ""}`}>
          {photosMap[ad.id] ? (
            <div className="w-full h-40 bg-viaturas-50">
              <img src={photosMap[ad.id]} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-viaturas-50 flex items-center justify-center text-4xl">🚗</div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-viaturas-900">{d.marca && d.modelo ? `${d.marca} ${d.modelo}` : ad.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-viaturas-100 text-viaturas-700">{STATUS_LABEL[ad.status] ?? ad.status}</span>
            </div>
            <p className="text-xs text-viaturas-500 mb-2">{VIATURAS_AD_TYPES[ad.type]?.icon} {VIATURAS_AD_TYPES[ad.type]?.label ?? ad.type}</p>
            {ad.type === "venda" && (
              <p className="text-lg font-bold text-viaturas-700 mb-2">
                {ad.price == null ? "Consultar" : "€" + ad.price.toFixed(2)}
              </p>
            )}
            <p className="text-sm text-viaturas-500">📍 {ad.location}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-viaturas-900 mb-2">Meus Anúncios</h1>
          <p className="text-viaturas-700 mb-8">Gere as tuas viaturas no StandGo</p>

          {activeAds.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-viaturas-900 mb-4">Ativos ({activeAds.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAds.map((ad) => renderCard(ad))}
              </div>
            </div>
          )}

          {encerradosAds.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-viaturas-900 mb-4">Encerrados ({encerradosAds.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {encerradosAds.map((ad) => renderCard(ad, true))}
              </div>
            </div>
          )}

          {ads && ads.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-viaturas-200">
              <p className="text-viaturas-700 text-lg mb-4">Ainda não tens nenhuma viatura anunciada</p>
              <Link href="/viaturas/novo">
                <button className="bg-viaturas-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-viaturas-700">
                  Vender Primeira Viatura
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
