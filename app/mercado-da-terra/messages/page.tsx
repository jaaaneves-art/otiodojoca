import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const profileIds = new Set<string>();
  (conversations || []).forEach((c: any) => {
    profileIds.add(c.buyer_id);
    profileIds.add(c.seller_id);
  });

  const profilesMap: Record<string, any> = {};
  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", Array.from(profileIds));

    profiles?.forEach((p: any) => {
      profilesMap[p.id] = p;
    });
  }

  const enriched = await Promise.all((conversations || []).map(async (conv: any) => {
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
    const otherPartyId = isBuyer ? conv.seller_id : conv.buyer_id;
    const otherParty = profilesMap[otherPartyId];

    return {
      ...conv,
      lastMsg,
      unreadCount: unreadCount || 0,
      otherParty,
      isBuyer,
    };
  }));

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
    <div className="min-h-screen bg-terra-50">
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            ← Voltar ao Mercado
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-terra-900 mb-6">Mensagens</h1>

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
  );
}
