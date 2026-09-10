import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import AuctionCountdownBadge from "@/components/viaturas/auction-countdown-badge";
import { ArrowLeft, Gavel } from "lucide-react";

export default async function LeiloesViaturasPage() {
  // Mesmo motor do Gran Bazar (licitação ascendente simples, nível 4) — ver
  // docs/VIATURAS.md, secção 3. Esta página lista os leilões em curso ou
  // agendados; licitar acontece na página do próprio anúncio (componente
  // AuctionPanel), nunca aqui diretamente.
  const supabase = await createClient();

  const { data: auctions } = await supabase
    .from("marketplace_auctions")
    .select(`
      id, current_price, starts_at, ends_at, status,
      ad:marketplace_ads!inner(id, title, module, status, details)
    `)
    .eq("ad.module", "viaturas")
    .eq("ad.status", "active")
    .in("status", ["scheduled", "live"])
    .order("ends_at", { ascending: true });

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
          <div className="mb-6">
            <Link href="/viaturas" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"><ArrowLeft size={17} /> Voltar às viaturas</Link>
          </div>

          <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Gavel size={23} /></span>
            <h1 className="relative mt-5 text-3xl font-black tracking-[-.04em] sm:text-4xl">Leilões de viaturas</h1>
            <p className="relative mt-2 max-w-xl text-sm leading-6 text-slate-300">Acompanha os leilões em curso, consulta os detalhes e licita diretamente no anúncio.</p>
          </div>

          {auctions && auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auction: any) => {
                const d = auction.ad?.details ?? {};
                const titulo = d.marca && d.modelo ? `${d.marca} ${d.modelo}` : auction.ad?.title;
                return (
                  <Link key={auction.id} href={`/viaturas/${auction.ad?.id}`}>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-amber-800 text-white">🔨 Leilão</span>
                        <AuctionCountdownBadge
                          status={auction.status}
                          endsAt={auction.ends_at}
                          startsAt={auction.starts_at}
                          formatoData="curta"
                        />
                      </div>
                      <h3 className="font-semibold text-viaturas-900 mb-2">{titulo}</h3>
                      <p className="text-lg font-bold text-amber-800">{Number(auction.current_price).toFixed(2)} €</p>
                    </article>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
              <Gavel className="mx-auto mb-4 text-slate-400" size={28} /><p className="font-bold">Não há leilões em curso ou agendados neste momento.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
