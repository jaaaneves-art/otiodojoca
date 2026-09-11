import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import LupNavbar from "@/components/lup/lup-navbar";
import { LUP_AD_TYPES } from "@/lib/lup/ad-types";
import { CirclePlus, Eye, LayoutDashboard, MapPin, Pencil, Recycle } from "lucide-react";
import { LupEmptyState, LupPageHeader, lupMainClass, lupPageClass } from "@/components/lup/lup-ui";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", active: "Disponível", reserved: "Reservado", sold: "Vendido",
  traded: "Trocado", given: "Entregue", expired: "Expirado", cancelled: "Cancelado", inactive: "Indisponível",
};

export default async function MeusAnunciosLupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("author_id", user.id)
    .eq("module", "lup")
    .order("created_at", { ascending: false });

  const activeAds = ads?.filter((ad) => ad.status === "active") || [];
  const encerradosAds = ads?.filter((ad) => ["sold", "traded", "given", "expired", "cancelled"].includes(ad.status)) || [];

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
    <article
      key={ad.id}
      className={`flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-lup-200 bg-white shadow-[0_12px_35px_rgba(15,74,44,0.05)] transition hover:-translate-y-1 hover:border-lup-300 hover:shadow-[0_20px_45px_rgba(15,74,44,0.1)] ${faded ? "opacity-65 grayscale-[20%]" : ""}`}
    >
      <Link href={`/lup/${ad.id}`} className="block">
        {photosMap[ad.id] ? (
          <div className="h-40 w-full bg-lup-50">
            <img src={photosMap[ad.id]} alt={ad.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-[radial-gradient(circle_at_top_right,#dcfce8,#f7fff9_65%)] text-lup-600">
            <Recycle className="h-10 w-10" />
          </div>
        )}
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="font-extrabold leading-snug text-lup-950">{ad.title}</h3>
            <span className="shrink-0 rounded-full bg-lup-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-lup-700">{STATUS_LABEL[ad.status] ?? ad.status}</span>
          </div>
          <p className="mb-2 text-xs text-lup-500">{LUP_AD_TYPES[ad.type]?.icon} {LUP_AD_TYPES[ad.type]?.label ?? ad.type}</p>
          {ad.type === "venda" && (
            <p className="mb-2 text-lg font-bold text-lup-700">
              {ad.price == null ? "Grátis" : "€" + ad.price.toFixed(2)}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-lup-600"><MapPin className="h-4 w-4" /> {ad.location}</p>
        </div>
      </Link>

      <div className="mt-auto flex border-t border-lup-100">
        <Link
          href={`/lup/editar/${ad.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-bold text-lup-700 transition hover:bg-lup-50"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Link>
        <Link
          href={`/lup/${ad.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-lup-100 py-3 text-sm font-bold text-lup-600 transition hover:bg-lup-50"
        >
          <Eye className="h-3.5 w-3.5" /> Ver anúncio
        </Link>
      </div>
    </article>
  );

  return (
    <>
      <LupNavbar />
      <div className={lupPageClass}>
        <main className={lupMainClass}>
          <LupPageHeader
            eyebrow="Painel pessoal"
            title="Os meus anúncios"
            description="Acompanha o que está disponível e consulta os ciclos já concluídos."
            icon={LayoutDashboard}
            action={<Link href="/lup/novo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lup-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-lup-800/15 transition hover:-translate-y-0.5 hover:bg-lup-800"><CirclePlus className="h-4 w-4" /> Novo anúncio</Link>}
          />

          {activeAds.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-4 text-xl font-extrabold text-lup-950">Ativos <span className="text-lup-600">({activeAds.length})</span></h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {activeAds.map((ad) => renderCard(ad))}
              </div>
            </div>
          )}

          {encerradosAds.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-4 text-xl font-extrabold text-lup-950">Encerrados <span className="text-lup-600">({encerradosAds.length})</span></h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {encerradosAds.map((ad) => renderCard(ad, true))}
              </div>
            </div>
          )}

          {ads && ads.length === 0 && (
            <LupEmptyState title="Ainda não publicaste nenhum anúncio" description="Transforma um excedente numa oportunidade útil para alguém perto de ti." href="/lup/novo" actionLabel="Publicar o primeiro anúncio" />
          )}
        </main>
      </div>
    </>
  );
}
