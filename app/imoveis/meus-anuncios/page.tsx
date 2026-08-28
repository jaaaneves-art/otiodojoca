import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ImoveisNavbar from "@/components/imoveis/imoveis-navbar";
import { IMOVEL_AD_TYPES } from "@/lib/imoveis/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", active: "Ativo", reserved: "Reservado", sold: "Vendido",
  expired: "Expirado", cancelled: "Cancelado", inactive: "Indisponível",
};

export default async function MeusAnunciosImoveisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", user.id)
    .eq("module", "imoveis")
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

  const renderCard = (ad: any, faded?: boolean) => (
    <Link key={ad.id} href={`/imoveis/${ad.id}`}>
      <div className={`bg-white rounded-lg border border-imoveis-200 hover:shadow-md transition cursor-pointer h-full overflow-hidden ${faded ? "opacity-60" : ""}`}>
        {photosMap[ad.id] ? (
          <div className="w-full h-40 bg-imoveis-50">
            <img src={photosMap[ad.id]} alt={ad.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-40 bg-imoveis-50 flex items-center justify-center text-4xl">🏠</div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-imoveis-900">{ad.title}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-imoveis-100 text-imoveis-700">{STATUS_LABEL[ad.status] ?? ad.status}</span>
          </div>
          <p className="text-xs text-imoveis-500 mb-2">{IMOVEL_AD_TYPES[ad.type]?.icon} {IMOVEL_AD_TYPES[ad.type]?.label ?? ad.type}</p>
          {ad.type === "venda" && (
            <p className="text-lg font-bold text-imoveis-700 mb-2">
              {ad.price == null ? "Sob consulta" : "€" + ad.price.toLocaleString("pt-PT")}
            </p>
          )}
          {(ad.type === "arrendamento" || ad.type === "quarto") && (
            <p className="text-lg font-bold text-imoveis-700 mb-2">
              {ad.price == null ? "Sob consulta" : "€" + ad.price.toLocaleString("pt-PT") + "/mês"}
            </p>
          )}
          <p className="text-sm text-imoveis-500">📍 {ad.location}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <ImoveisNavbar />
      <div className="min-h-screen bg-imoveis-50">
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-imoveis-900 mb-2">Meus Imóveis</h1>
          <p className="text-imoveis-700 mb-8">Gere os teus anúncios de imóveis</p>

          {activeAds.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-imoveis-900 mb-4">Ativos ({activeAds.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAds.map((ad) => renderCard(ad))}
              </div>
            </div>
          )}

          {encerradosAds.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-imoveis-900 mb-4">Encerrados ({encerradosAds.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {encerradosAds.map((ad) => renderCard(ad, true))}
              </div>
            </div>
          )}

          {ads && ads.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-imoveis-200">
              <p className="text-imoveis-700 text-lg mb-4">Ainda não tens nenhum imóvel publicado</p>
              <Link href="/imoveis/novo">
                <button className="bg-imoveis-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-imoveis-700">
                  Publicar Primeiro Imóvel
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
