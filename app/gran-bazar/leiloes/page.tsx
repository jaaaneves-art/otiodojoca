import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import GranBazarNavbar from "@/components/gran-bazar/gran-bazar-navbar";
import AuctionCountdownBadge from "@/components/gran-bazar/auction-countdown-badge";

export default async function LeiloesBazarPage() {
  // Licitação em tempo real (nível 4) — ver
  // supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql e
  // docs/GRAN-BAZAR.md, secção "Leilões". Esta página lista os leilões em
  // curso ou agendados; licitar acontece na página do próprio anúncio
  // (componente AuctionPanel), nunca aqui diretamente.
  const supabase = await createClient();

  const { data: auctions } = await supabase
    .from("marketplace_auctions")
    .select(`
      id, current_price, starts_at, ends_at, status,
      ad:marketplace_ads!inner(id, title, module, status)
    `)
    .eq("ad.module", "gran-bazar")
    .eq("ad.status", "active")
    .in("status", ["scheduled", "live"])
    .order("ends_at", { ascending: true });

  return (
    <>
      <GranBazarNavbar />
      <div className="min-h-screen bg-bazar-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/gran-bazar" className="text-bazar-700 hover:text-bazar-900">← Voltar ao Gran Bazar</Link>
          </div>

          <div className="bg-bazar-900 rounded-2xl p-8 mb-8 text-center">
            <p className="text-4xl mb-2">🔨</p>
            <h1 className="text-3xl font-bold text-white mb-1">Leilões</h1>
            <p className="text-bazar-100">Licita nos leilões em curso — o lance vence quando o leilão termina.</p>
          </div>

          {auctions && auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auction: any) => (
                <Link key={auction.id} href={`/gran-bazar/${auction.ad?.id}`}>
                  <div className="bg-white rounded-lg border border-bazar-200 p-4 hover:border-amber-500 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-amber-800 text-white">🔨 Leilão</span>
                      <AuctionCountdownBadge
                        status={auction.status}
                        endsAt={auction.ends_at}
                        startsAt={auction.starts_at}
                        formatoData="curta"
                      />
                    </div>
                    <h3 className="font-semibold text-bazar-900 mb-2">{auction.ad?.title}</h3>
                    <p className="text-lg font-bold text-amber-800">{Number(auction.current_price).toFixed(2)} €</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-bazar-200 p-10 text-center text-bazar-600">
              Não há leilões em curso ou agendados neste momento.
            </div>
          )}
        </main>
      </div>
    </>
  );
}
