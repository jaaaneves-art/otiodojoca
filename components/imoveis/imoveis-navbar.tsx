import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ImoveisNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mensagens não lidas, só das conversas ligadas a anúncios do módulo
  // Imóveis — mesma disciplina do Gran Bazar/Lup (marketplace_conversations
  // é genérica, ligada só por ad_id; filtra-se primeiro os ids de anúncios
  // deste módulo).
  let unreadTotal = 0;

  if (user) {
    const { data: imoveisAdIds } = await supabase
      .from("marketplace_ads")
      .select("id")
      .eq("module", "imoveis");

    const adIdSet = (imoveisAdIds || []).map((a: any) => a.id);

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
    <nav className="bg-imoveis-900 border-b border-imoveis-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/imoveis">
          <h1 className="text-2xl font-bold text-white cursor-pointer">🏠 Imóveis</h1>
        </Link>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <Link href="/imoveis/mensagens" className="relative">
                <button className="border border-imoveis-600 text-imoveis-50 font-medium py-2 px-4 rounded-lg hover:bg-imoveis-800 flex items-center gap-2">
                  💬 Mensagens
                  {unreadTotal > 0 && (
                    <span className="bg-imoveis-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                </button>
              </Link>

              <Link href="/imoveis/favoritos">
                <button className="border border-imoveis-600 text-imoveis-50 font-medium py-2 px-4 rounded-lg hover:bg-imoveis-800">
                  ❤️ Favoritos
                </button>
              </Link>

              <Link href="/imoveis/meus-anuncios">
                <button className="border border-imoveis-600 text-imoveis-50 font-medium py-2 px-4 rounded-lg hover:bg-imoveis-800">
                  Meus Anúncios
                </button>
              </Link>

              <Link href="/imoveis/novo">
                <button className="bg-imoveis-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-imoveis-700">
                  + Publicar Imóvel
                </button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-imoveis-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-imoveis-700">
                Entrar
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
