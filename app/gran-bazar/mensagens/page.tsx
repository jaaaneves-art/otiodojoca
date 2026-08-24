import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import GranBazarNavbar from "@/components/gran-bazar/gran-bazar-navbar";

export default async function InboxBazarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // As conversas são genéricas (ligadas só por ad_id) — para mostrar aqui só
  // as do Gran Bazar, primeiro filtramos os ids de anúncios deste módulo.
  const { data: bazarAds } = await supabase
    .from("marketplace_ads")
    .select("id")
    .eq("module", "gran-bazar");

  const bazarAdIds = (bazarAds || []).map((a: any) => a.id);

  let conversationList: any[] = [];
  if (bazarAdIds.length > 0) {
    const { data: conversations } = await supabase
      .from("marketplace_conversations")
      .select(`
        id, ad_id, buyer_id, seller_id, updated_at, created_at,
        ad:marketplace_ads(id, title, price, price_type, status)
      `)
      .in("ad_id", bazarAdIds)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    conversationList = conversations || [];
  }

  const participantIds = Array.from(
    new Set(conversationList.flatMap((c: any) => [c.buyer_id, c.seller_id]))
  );

  const profilesMap: Record<string, any> = {};
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", participantIds);

    profiles?.forEach((p: any) => { profilesMap[p.id] = p; });
  }

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

    return { ...conv, lastMsg, unreadCount: unreadCount || 0, otherParty, isBuyer };
  }));

  const adIds = enriched.map((c: any) => c.ad_id);
  const photosMap: Record<number, string> = {};
  if (adIds.length > 0) {
    const { data: photos } = await supabase
      .from("marketplace_photos")
      .select("ad_id, storage_path, sort_order")
      .in("ad_id", adIds)
      .order("sort_order", { ascending: true });

    photos?.forEach((p: any) => { if (!photosMap[p.ad_id]) photosMap[p.ad_id] = p.storage_path; });
  }

  return (
    <>
      <GranBazarNavbar />
      <div className="min-h-screen bg-bazar-50">
        <main className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-bazar-900 mb-6">💬 Mensagens</h1>

          {enriched.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-bazar-200">
              <p className="text-bazar-700 text-lg mb-4">Ainda não tens conversas</p>
              <Link href="/gran-bazar">
                <button className="bg-bazar-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-bazar-600">
                  Explorar o Gran Bazar
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
                  <Link key={conv.id} href={`/gran-bazar/mensagens/${conv.id}`}>
                    <div className={`bg-white rounded-lg border border-bazar-200 hover:shadow-md transition p-4 flex gap-4 items-center cursor-pointer ${hasUnread ? "border-l-4 border-l-bazar-500" : ""}`}>
                      {photo ? (
                        <img src={photo} alt={conv.ad?.title} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-bazar-50 rounded-lg flex items-center justify-center text-2xl">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-bazar-900 truncate">{conv.ad?.title || "Anúncio removido"}</p>
                          {hasUnread && (
                            <span className="ml-2 bg-bazar-500 text-white text-xs px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-sm text-bazar-600 mb-1">
                          {conv.isBuyer ? "Anunciante" : "Interessado"}: <span className="font-medium">{otherName}</span>
                        </p>
                        <p className={`text-sm truncate ${hasUnread ? "text-bazar-900 font-medium" : "text-bazar-500"}`}>{previewTruncated}</p>
                      </div>
                      <div className="text-xs text-bazar-500 whitespace-nowrap">
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
