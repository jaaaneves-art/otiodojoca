import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Fuel, Gauge, MapPin, Palette, Settings2, ShieldCheck, Sparkles, UserRound, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ContactSellerForm from "@/components/viaturas/contact-seller-form";
import FavoriteButton from "@/components/viaturas/favorite-button";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import AuctionPanel from "@/components/viaturas/auction-panel";
import { ViaturaGallery } from "@/components/viaturas/viatura-gallery";
import { VIATURAS_AD_TYPES } from "@/lib/viaturas/ad-types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", active: "Ativo", reserved: "Reservado", sold: "Vendido",
  expired: "Expirado", cancelled: "Cancelado", inactive: "Indisponível",
};

const formatKm = (km: string | number | undefined) =>
  km == null || km === "" ? null : `${Number(km).toLocaleString("pt-PT")} km`;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

export default async function ViaturaAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: ad, error } = await supabase.from("marketplace_ads").select(`*, author:profiles(id, username, avatar_url)`).eq("id", id).eq("module", "viaturas").single();
  if (error || !ad) notFound();

  const { data: photos } = await supabase.from("marketplace_photos").select("id, storage_path, sort_order").eq("ad_id", ad.id).order("sort_order", { ascending: true });
  const { data: { user } } = await supabase.auth.getUser();
  let isFavorite = false;
  if (user) {
    const { data: fav } = await supabase.from("marketplace_favorites").select("id").eq("user_id", user.id).eq("ad_id", ad.id).maybeSingle();
    isFavorite = !!fav;
  }

  let auction: any = null;
  let auctionBids: any[] = [];
  if (ad.type === "leilao") {
    const { data: auctionRow } = await supabase.from("marketplace_auctions").select("id, ad_id, current_price, minimum_increment, starts_at, ends_at, status, winner_id").eq("ad_id", ad.id).maybeSingle();
    auction = auctionRow;
    if (auction) {
      const { data: bidsData } = await supabase.from("marketplace_auction_bids").select("id, bidder_id, amount, created_at, bidder:profiles(username)").eq("auction_id", auction.id).order("amount", { ascending: false });
      auctionBids = (bidsData ?? []).map((bid: any) => ({ id: bid.id, bidder_id: bid.bidder_id, amount: bid.amount, created_at: bid.created_at, bidder_username: bid.bidder?.username }));
    }
  }

  const typeInfo = VIATURAS_AD_TYPES[ad.type];
  const d = ad.details ?? {};
  const title = d.marca && d.modelo ? `${d.marca} ${d.modelo}` : ad.title;
  const characteristics = [
    { label: "Ano", value: d.ano, icon: CalendarDays },
    { label: "Quilómetros", value: formatKm(d.quilometros), icon: Gauge },
    { label: "Combustível", value: d.combustivel, icon: Fuel },
    { label: "Caixa", value: d.caixa, icon: Settings2 },
    { label: "Condição", value: d.condicao, icon: Sparkles },
    { label: "Cor", value: d.cor, icon: Palette },
    { label: "Potência", value: d.potencia ? `${d.potencia} cv` : null, icon: Zap },
    { label: "Vendedor", value: d.tipo_vendedor, icon: UserRound },
  ].filter((item) => Boolean(item.value));

  const priceBlock = ad.type === "comprar" ? (
    <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-purple-600">Orçamento disponível</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{ad.price == null ? "A combinar" : `Até ${formatPrice(ad.price)}`}</p></div>
  ) : ad.type === "ceder" ? (
    <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-600">Cedência</p><p className="mt-1 text-3xl font-black tracking-tight text-emerald-700">Grátis</p></div>
  ) : ad.type === "alugar" ? (
    <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-600">Aluguer desde</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{ad.price == null ? "Consultar" : formatPrice(ad.price)}<span className="text-base font-bold text-slate-500">/dia</span></p></div>
  ) : ad.type === "venda" ? (
    <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-600">Preço anunciado</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{ad.price == null ? "Consultar" : formatPrice(ad.price)}</p>{ad.price_type === "negotiable" && ad.price != null && <p className="mt-1 text-xs font-semibold text-slate-500">Valor negociável</p>}</div>
  ) : null;

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
          <Link href="/viaturas" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"><ArrowLeft size={17} aria-hidden="true" /> Voltar às viaturas</Link>

          <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-white">{typeInfo?.label ?? ad.type}</span>
                {d.condicao === "Novo" && <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-emerald-700">Novo</span>}
                {d.tipo_vendedor === "Stand" && <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-700"><ShieldCheck size={12} /> Stand</span>}
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${ad.status === "active" ? "bg-[#b7f34a] text-slate-950" : "bg-slate-200 text-slate-600"}`}>{STATUS_LABEL[ad.status] ?? ad.status}</span>
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">{title}</h1>
              {title !== ad.title && <p className="mt-2 text-sm text-slate-500">{ad.title}</p>}
            </div>
            {ad.location && <p className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={17} className="text-blue-600" /> {ad.location}</p>}
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><ViaturaGallery photos={photos ?? []} title={title} /></section>

              {characteristics.length > 0 && (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Ficha rápida</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">O essencial desta viatura</h2>
                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {characteristics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><Icon size={19} className="mb-3 text-blue-600" aria-hidden="true" /><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 font-extrabold text-slate-900">{String(value)}</dd></div>)}
                  </dl>
                </section>
              )}

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Descrição</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Tudo o que precisas de saber</h2>
                <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-600">{ad.description}</p>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Anunciante</p>
                {ad.author ? <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3">{ad.author.avatar_url ? <img src={ad.author.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><UserRound size={25} /></span>}<div><p className="font-black text-slate-950">{ad.author.username}</p><p className="text-xs text-slate-500">Membro da comunidade OTJ</p></div></div><Link href={`/perfil/${ad.author.id}`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">Ver perfil</Link></div> : <p className="mt-4 text-sm text-slate-500">Utilizador não encontrado.</p>}
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-36">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
                {ad.type === "leilao" ? auction ? <AuctionPanel auction={auction} sellerId={ad.author_id} currentUserId={user?.id} bids={auctionBids} /> : <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Os dados deste leilão ainda não estão disponíveis.</p> : priceBlock}

                {ad.type === "alugar" && <div className="mt-5 grid grid-cols-2 gap-2">{[["3 dias", d.preco_3_dias], ["1 semana", d.preco_semana], ["2 semanas", d.preco_2_semanas], ["1 mês", d.preco_mes]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{formatPrice(Number(value))}</p></div>)}</div>}

                <div className="my-5 border-t border-slate-100" />
                <div className="space-y-3">
                  <ContactSellerForm adId={ad.id} sellerId={ad.author_id} currentUserId={user?.id} />
                  <FavoriteButton adId={ad.id} isFavorite={isFavorite} isLoggedIn={!!user} variant="detail" />
                </div>
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                  <p className="flex justify-between gap-3"><span>Publicado</span><strong className="text-slate-700">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</strong></p>
                  <p className="flex justify-between gap-3"><span>Contacto</span><strong className="text-slate-700">{ad.contact_method === "message" ? "Mensagem privada" : ad.contact_method === "phone" ? "Telefone" : "Email"}</strong></p>
                  <p className="flex justify-between gap-3"><span>Referência</span><strong className="text-slate-700">SG-{ad.id}</strong></p>
                </div>
              </div>
              <p className="px-4 text-center text-xs leading-5 text-slate-500">Confirma sempre a documentação e o estado da viatura antes de efetuares qualquer pagamento.</p>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
