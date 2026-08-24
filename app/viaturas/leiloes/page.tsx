import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import AuctionCountdownBadge from "@/components/viaturas/auction-countdown-badge";

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
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/viaturas" className="text-viaturas-700 hover:text-viaturas-900">← Voltar ao StandGo</Link>
          </div>

          <div className="bg-viaturas-900 rounded-2xl p-8 mb-8 text-center">
            <p className="text-4xl mb-2">🔨</p>
            <h1 className="text-3xl font-bold text-white mb-1">Leilões de Viaturas</h1>
            <p className="text-viaturas-100">Licita nos leilões em curso — o lance vence quando o leilão termina.</p>
          </div>

          {auctions && auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auction: any) => {
                const d = auction.ad?.details ?? {};
                const titulo = d.marca && d.modelo ? `${d.marca} ${d.modelo}` : auction.ad?.title;
                return (
                  <Link key={auction.id} href={`/viaturas/${auction.ad?.id}`}>
                    <div className="bg-white rounded-lg border border-viaturas-200 p-4 hover:border-amber-500 transition">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-viaturas-200 p-10 text-center text-viaturas-600">
              Não há leilões de viaturas em curso ou agendados neste momento.
            </div>
          )}
        </main>
      </div>
    </>
  );
}
