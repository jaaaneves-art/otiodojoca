import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactSellerForm from "@/components/lup/contact-seller-form";
import LupFavoriteButton from "@/components/lup/favorite-button";
import LupNavbar from "@/components/lup/lup-navbar";
import { LUP_AD_TYPES, estimarCo2Evitado } from "@/lib/lup/ad-types";
import { CalendarDays, Clock3, Leaf, Mail, MapPin, MessageCircle, Package2, PawPrint, Recycle, Salad, Sparkles, UserRound } from "lucide-react";
import { LupBackLink, lupPageClass } from "@/components/lup/lup-ui";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  traded: "Trocado",
  given: "Entregue",
  expired: "Expirado",
  cancelled: "Cancelado",
  inactive: "Indisponível",
};

const CATEGORIA_ICON: Record<string, typeof Leaf> = {
  "lup-humano": Salad,
  "lup-animal": PawPrint,
  "lup-compostagem": Leaf,
};

function formatarDataHora(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

export default async function LupAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select(`*, author:profiles(id, username, avatar_url), category:categories(name, slug)`)
    .eq("id", id)
    .eq("module", "lup")
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

  let isFavorite = false;
  if (user) {
    const { data: fav } = await supabase
      .from("marketplace_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("ad_id", ad.id)
      .maybeSingle();
    isFavorite = !!fav;
  }

  const typeInfo = LUP_AD_TYPES[ad.type];
  const details = ad.details ?? {};
  const co2 = estimarCo2Evitado(details.kg_estimate ? parseFloat(details.kg_estimate) : null);
  const inicio = formatarDataHora(details.pickup_starts_at);
  const fim = formatarDataHora(details.pickup_ends_at);
  const CategoryIcon = CATEGORIA_ICON[ad.category?.slug ?? ""] ?? Recycle;

  return (
    <>
      <LupNavbar />
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <LupBackLink href="/lup">Voltar ao LUP</LupBackLink>

          <article className="overflow-hidden rounded-[2rem] border border-lup-200/90 bg-white shadow-[0_24px_65px_rgba(15,74,44,0.1)]">
            <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-lup-700 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                    {typeInfo?.icon} {typeInfo?.label ?? ad.type}
                  </span>
                  {ad.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-lup-200 bg-lup-50 px-3 py-1.5 text-xs font-bold text-lup-800">
                      <CategoryIcon className="h-3.5 w-3.5" /> {ad.category.name}
                    </span>
                  )}
                </div>
                <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-lup-950 sm:text-4xl">{ad.title}</h1>
              </div>
              <span className={`w-fit shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                ad.status === "active" ? "bg-green-100 text-green-700" :
                ["sold", "traded", "given"].includes(ad.status) ? "bg-gray-100 text-gray-600" :
                "bg-lup-100 text-lup-700"
              }`}>
                {STATUS_LABEL[ad.status] ?? ad.status}
              </span>
            </div>

            {photos && photos.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 overflow-hidden rounded-2xl bg-lup-50">
                  <img src={photos[0].storage_path} alt={ad.title} className="h-[20rem] w-full object-cover sm:h-[28rem]" />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((photo: any, index: number) => (
                      <img key={photo.id} src={photo.storage_path} alt={`${ad.title} — fotografia ${index + 1}`} className="h-20 w-full cursor-pointer rounded-xl border border-lup-200 object-cover transition hover:border-lup-500 hover:opacity-90" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {ad.type === "procura" ? (
              <div className="mb-7 rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-bold text-purple-700">Este anúncio é um pedido de recolha</p>
              </div>
            ) : (
              <div className="mb-7 text-3xl font-black tracking-tight text-lup-700">
                {ad.type === "oferta" || ad.price == null ? "GRÁTIS" : `${ad.price.toFixed(2)} €`}
              </div>
            )}

            {(details.quantity || co2 != null || inicio || fim) && (
              <div className="mb-9 grid grid-cols-1 gap-3 border-b border-lup-200 pb-9 sm:grid-cols-2 lg:grid-cols-4">
                {details.quantity && (
                  <div className="rounded-2xl bg-lup-50 p-4">
                    <p className="text-sm text-lup-600">Quantidade</p>
                    <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950"><Package2 className="h-4 w-4 text-lup-600" /> {details.quantity} {details.unit ?? ""}</p>
                  </div>
                )}
                {co2 != null && (
                  <div className="rounded-2xl bg-lup-50 p-4">
                    <p className="text-sm text-lup-600">Impacto (estimativa)</p>
                    <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950"><Sparkles className="h-4 w-4 text-lup-600" /> ~{co2} kg CO₂ evitado</p>
                  </div>
                )}
                {inicio && (
                  <div className="rounded-2xl bg-lup-50 p-4">
                    <p className="text-sm text-lup-600">Disponível a partir de</p>
                    <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950"><CalendarDays className="h-4 w-4 text-lup-600" /> {inicio}</p>
                  </div>
                )}
                {fim && (
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Recolher até</p>
                    <p className="mt-1 flex items-center gap-2 font-extrabold text-amber-900"><Clock3 className="h-4 w-4" /> {fim}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-9 border-b border-lup-200 pb-9">
              <h2 className="mb-3 text-xl font-extrabold text-lup-950">Sobre este anúncio</h2>
              <p className="whitespace-pre-wrap leading-7 text-lup-800">{ad.description}</p>
            </div>

            <div className="mb-9 grid grid-cols-1 gap-5 border-b border-lup-200 pb-9 sm:grid-cols-3">
              <div>
                <p className="text-sm text-lup-600">Localização</p>
                <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950"><MapPin className="h-4 w-4 text-lup-600" /> {ad.location}</p>
              </div>
              <div>
                <p className="text-sm text-lup-600">Publicado em</p>
                <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950"><CalendarDays className="h-4 w-4 text-lup-600" /> {new Date(ad.created_at).toLocaleDateString("pt-PT")}</p>
              </div>
              <div>
                <p className="text-sm text-lup-600">Contacto</p>
                <p className="mt-1 flex items-center gap-2 font-extrabold text-lup-950">
                  {ad.contact_method === "message" ? <><MessageCircle className="h-4 w-4 text-lup-600" /> Mensagem</> :
                   ad.contact_method === "phone" ? "Telefone" : <><Mail className="h-4 w-4 text-lup-600" /> Email</>}
                </p>
              </div>
            </div>

            <div className="mb-7 rounded-2xl border border-lup-100 bg-lup-50 p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-lup-950"><UserRound className="h-5 w-5 text-lup-600" /> Anunciante</h2>
              {ad.author ? (
                <div className="flex items-center gap-4">
                  {ad.author.avatar_url && (
                    <img src={ad.author.avatar_url} alt={ad.author.username} className="h-14 w-14 rounded-2xl object-cover" />
                  )}
                  <div>
                    <p className="font-extrabold text-lup-950">{ad.author.username}</p>
                    <Link href={`/perfil/${ad.author.id}`} className="text-sm font-bold text-lup-700 hover:text-lup-950">
                      Ver Perfil →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-lup-700">Utilizador não encontrado</p>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <ContactSellerForm adId={ad.id} sellerId={ad.author_id} currentUserId={user?.id} />
              <LupFavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={!!user} variant="detail" />
              <Link href="/lup" className="flex-1">
                <span className="flex min-h-12 w-full items-center justify-center rounded-xl border border-lup-200 px-4 py-3 font-bold text-lup-700 transition hover:bg-lup-50">
                  Voltar à Lista
                </span>
              </Link>
            </div>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
