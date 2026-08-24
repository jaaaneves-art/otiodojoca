import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function GranBazarNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mensagens não lidas, só das conversas ligadas a anúncios do Gran Bazar.
  let unreadTotal = 0;

  if (user) {
    const { data: bazarAdIds } = await supabase
      .from("marketplace_ads")
      .select("id")
      .eq("module", "gran-bazar");

    const adIdSet = (bazarAdIds || []).map((a: any) => a.id);

    if (adIdSet.length > 0) {
      const { data: convs } = await supabase
        .from("marketplace_conversations")
        .select("id")
        .in("ad_id", adIdSet)
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
  }

  return (
    <nav className="bg-bazar-900 border-b border-bazar-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/gran-bazar">
          <h1 className="text-2xl font-bold text-white cursor-pointer">🏮 Gran Bazar</h1>
        </Link>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <Link href="/gran-bazar/mensagens" className="relative">
                <button className="border border-bazar-600 text-bazar-50 font-medium py-2 px-4 rounded-lg hover:bg-bazar-800 flex items-center gap-2">
                  💬 Mensagens
                  {unreadTotal > 0 && (
                    <span className="bg-bazar-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                </button>
              </Link>

              <Link href="/gran-bazar/favoritos">
                <button className="border border-bazar-600 text-bazar-50 font-medium py-2 px-4 rounded-lg hover:bg-bazar-800">
                  ❤️ Favoritos
                </button>
              </Link>

              <Link href="/gran-bazar/meus-anuncios">
                <button className="border border-bazar-600 text-bazar-50 font-medium py-2 px-4 rounded-lg hover:bg-bazar-800">
                  Meus Anúncios
                </button>
              </Link>

              <Link href="/gran-bazar/novo">
                <button className="bg-bazar-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-bazar-600">
                  + Criar Anúncio
                </button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-bazar-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-bazar-600">
                Entrar
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
