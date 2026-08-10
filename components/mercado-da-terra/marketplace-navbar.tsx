import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MarketplaceNavbar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Contar mensagens não lidas do utilizador (em todas as suas conversas)
  let unreadTotal = 0;

  if (user) {
    // Buscar IDs das conversas do utilizador
    const { data: convs } = await supabase
      .from("marketplace_conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    const convIds = (convs || []).map((c: any) => c.id);

    if (convIds.length > 0) {
      const { count } = await supabase
        .from("marketplace_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      unreadTotal = count || 0;
    }
  }

  return (
    <nav className="bg-white border-b border-terra-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/mercado-da-terra">
          <h1 className="text-2xl font-bold text-terra-800 cursor-pointer">🌾 Mercado da Terra</h1>
        </Link>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              {/* Link Mensagens com badge */}
              <Link href="/mercado-da-terra/messages" className="relative">
                <button className="border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50 flex items-center gap-2">
                  💬 Mensagens
                  {unreadTotal > 0 && (
                    <span className="bg-terra-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                </button>
              </Link>

              <Link href="/mercado-da-terra/meus-anuncios">
                <button className="border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50">
                  Meus Anúncios
                </button>
              </Link>

              <Link href="/mercado-da-terra/novo">
                <button className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700">
                  + Novo Anúncio
                </button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700">
                Entrar
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}