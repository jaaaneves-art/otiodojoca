import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";

export default async function InboxViaturasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // As conversas ligadas a anúncio são genéricas (só por ad_id) — para
  // mostrar aqui só as de Viaturas, filtramos os ids de anúncios deste
  // módulo. As conversas DIRETAS entre stands (ad_id null) não têm
  // anúncio para as identificar, por isso usam a coluna "module" (ver
  // migration 20260828140000_stand_automovel_contacto_direto.sql).
  const { data: viaturaAds } = await supabase
    .from("marketplace_ads")
    .select("id")
    .eq("module", "viaturas");

  const viaturaAdIds = (viaturaAds || []).map((a: any) => a.id);

  const orCondicao =
    viaturaAdIds.length > 0
      ? `ad_id.in.(${viaturaAdIds.join(",")}),and(ad_id.is.null,module.eq.viaturas)`
      : `and(ad_id.is.null,module.eq.viaturas)`;

  const { data: conversations } = await supabase
    .from("marketplace_conversations")
    .select(`
      id, ad_id, buyer_id, seller_id, updated_at, created_at,
      ad:marketplace_ads(id, title, price, price_type, status, details)
    `)
    .or(orCondicao)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const conversationList = conversations || [];

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

  const adIds = enriched.map((c: any) => c.ad_id).filter((id: any) => id != null);
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
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-viaturas-900 mb-6">💬 Mensagens</h1>

          {enriched.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-viaturas-200">
              <p className="text-viaturas-700 text-lg mb-4">Ainda não tens conversas</p>
              <Link href="/viaturas">
                <button className="bg-viaturas-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-viaturas-700">
                  Explorar o StandGo
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
                const isDirect = conv.ad_id == null;
                const d = conv.ad?.details ?? {};
                const adTitulo = isDirect
                  ? "🤝 Conversa direta com stand"
                  : d.marca && d.modelo ? `${d.marca} ${d.modelo}` : (conv.ad?.title || "Anúncio removido");

                return (
                  <Link key={conv.id} href={`/viaturas/mensagens/${conv.id}`}>
                    <div className={`bg-white rounded-lg border border-viaturas-200 hover:shadow-md transition p-4 flex gap-4 items-center cursor-pointer ${hasUnread ? "border-l-4 border-l-viaturas-600" : ""}`}>
                      {photo ? (
                        <img src={photo} alt={adTitulo} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-viaturas-50 rounded-lg flex items-center justify-center text-2xl">{isDirect ? "🤝" : "🚗"}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-viaturas-900 truncate">{adTitulo}</p>
                          {hasUnread && (
                            <span className="ml-2 bg-viaturas-600 text-white text-xs px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-sm text-viaturas-600 mb-1">
                          {isDirect ? "Stand" : conv.isBuyer ? "Anunciante" : "Interessado"}: <span className="font-medium">{otherName}</span>
                        </p>
                        <p className={`text-sm truncate ${hasUnread ? "text-viaturas-900 font-medium" : "text-viaturas-500"}`}>{previewTruncated}</p>
                      </div>
                      <div className="text-xs text-viaturas-500 whitespace-nowrap">
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
