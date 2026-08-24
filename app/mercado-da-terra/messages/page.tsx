import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar todas as conversas do utilizador, restritas a anúncios do
  // Mercado da Terra (a mesma tabela de conversas é partilhada com o
  // Gran Bazar, ligada só por ad_id, por isso filtramos primeiro os ids
  // de anúncios deste módulo).
  // Nota: buyer_id/seller_id referenciam auth.users, não profiles — por isso
  // não dá para embutir profiles diretamente na query (o PostgREST não
  // consegue inferir essa relação). Os perfis são buscados à parte, mais
  // abaixo, com .in("id", [...]).
  const { data: terraAds } = await supabase
    .from("marketplace_ads")
    .select("id")
    .eq("module", "mercado-da-terra");

  const terraAdIds = (terraAds || []).map((a: any) => a.id);

  let conversationList: any[] = [];
  if (terraAdIds.length > 0) {
    const { data: conversations } = await supabase
      .from("marketplace_conversations")
      .select(`
        id,
        ad_id,
        buyer_id,
        seller_id,
        updated_at,
        created_at,
        ad:marketplace_ads(id, title, price, price_type, status)
      `)
      .in("ad_id", terraAdIds)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    conversationList = conversations || [];
  }

  // Buscar perfis de todos os interlocutores envolvidos, numa única query.
  const participantIds = Array.from(
    new Set(conversationList.flatMap((c: any) => [c.buyer_id, c.seller_id]))
  );

  const profilesMap: Record<string, any> = {};
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", participantIds);

    profiles?.forEach((p: any) => {
      profilesMap[p.id] = p;
    });
  }

  // Para cada conversa, buscar última mensagem e contagem de não lidas
  const enriched = await Promise.all(conversationList.map(async (conv: any) => {
    const { data: lastMsg } = await supabase
      .from("marketplace_messages")
      .select("content, created_at, sender_id, read_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: unreadCount } = await supabase
      .from("marketplace_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .neq("sender_id", user.id)
      .is("read_at", null);

    const isBuyer = conv.buyer_id === user.id;
    const otherParty = isBuyer ? profilesMap[conv.seller_id] : profilesMap[conv.buyer_id];

    return {
      ...conv,
      lastMsg,
      unreadCount: unreadCount || 0,
      otherParty,
      isBuyer,
    };
  }));

  // Buscar primeira foto de cada anúncio
  const adIds = enriched.map((c: any) => c.ad_id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((p: any) => {
      if (!photosMap[p.ad_id]) photosMap[p.ad_id] = p.storage_path;
    });
  }

  return (
    <>
      <MarketplaceNavbar />
      <div className="min-h-screen bg-terra-50">
        <main className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-terra-900 mb-6">💬 Mensagens</h1>

          {enriched.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-terra-200">
              <p className="text-terra-600 text-lg mb-4">Ainda não tens conversas</p>
              <Link href="/mercado-da-terra">
                <button className="bg-terra-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-terra-700">
                  Explorar o Mercado
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enriched.map((conv: any) => {
                const photo = photosMap[conv.ad_id];
                const otherName = conv.otherParty?.username || "Utilizador";
                const preview = conv.lastMsg?.content || "Sem mensagens";
                const previewTruncated = preview.length > 60 ? preview.substring(0, 60) + "..." : preview;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <Link key={conv.id} href={`/mercado-da-terra/messages/${conv.id}`}>
                    <div className={`bg-white rounded-lg border border-terra-200 hover:shadow-md transition p-4 flex gap-4 items-center cursor-pointer ${hasUnread ? "border-l-4 border-l-terra-600" : ""}`}>
                      {/* Miniatura do anúncio */}
                      {photo ? (
                        <img src={photo} alt={conv.ad?.title} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-terra-100 rounded-lg flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-terra-800 truncate">
                            {conv.ad?.title || "Anúncio removido"}
                          </p>
                          {hasUnread && (
                            <span className="ml-2 bg-terra-600 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-terra-600 mb-1">
                          {conv.isBuyer ? "Vendedor" : "Comprador"}: <span className="font-medium">{otherName}</span>
                        </p>
                        <p className={`text-sm truncate ${hasUnread ? "text-terra-900 font-medium" : "text-terra-500"}`}>
                          {previewTruncated}
                        </p>
                      </div>

                      <div className="text-xs text-terra-500 whitespace-nowrap">
                        {new Date(conv.updated_at).toLocaleDateString("pt-PT")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
