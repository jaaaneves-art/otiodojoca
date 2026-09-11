import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import LupNavbar from "@/components/lup/lup-navbar";
import { ChevronRight, MessageCircle, Recycle, UserRound } from "lucide-react";
import { LupEmptyState, LupPageHeader, lupPageClass } from "@/components/lup/lup-ui";

export default async function InboxLupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // As conversas são genéricas (ligadas só por ad_id) — para mostrar aqui só
  // as do Lup, primeiro filtramos os ids de anúncios deste módulo.
  const { data: lupAds } = await supabase
    .from("marketplace_ads")
    .select("id")
    .eq("module", "lup");

  const lupAdIds = (lupAds || []).map((a: any) => a.id);

  let conversationList: any[] = [];
  if (lupAdIds.length > 0) {
    const { data: conversations } = await supabase
      .from("marketplace_conversations")
      .select(`
        id, ad_id, buyer_id, seller_id, updated_at, created_at,
        ad:marketplace_ads(id, title, price, price_type, status)
      `)
      .in("ad_id", lupAdIds)
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
      <LupNavbar />
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
          <LupPageHeader eyebrow="Conversas" title="Mensagens" description="Combina recolhas e esclarece detalhes com segurança dentro do LUP." icon={MessageCircle} />

          {enriched.length === 0 ? (
            <LupEmptyState title="Ainda não tens conversas" description="Abre um anúncio e envia uma mensagem ao anunciante para começares." href="/lup" actionLabel="Explorar o LUP" />
          ) : (
            <div className="space-y-3">
              {enriched.map((conv: any) => {
                const photo = photosMap[conv.ad_id];
                const otherName = conv.otherParty?.username || "Utilizador";
                const preview = conv.lastMsg?.content || "Sem mensagens";
                const previewTruncated = preview.length > 60 ? preview.substring(0, 60) + "..." : preview;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <Link key={conv.id} href={`/lup/mensagens/${conv.id}`}>
                    <article className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-[0_8px_24px_rgba(15,74,44,0.04)] transition hover:-translate-y-0.5 hover:border-lup-300 hover:shadow-[0_14px_32px_rgba(15,74,44,0.09)] sm:gap-4 sm:p-4 ${hasUnread ? "border-lup-400 ring-2 ring-lup-100" : "border-lup-200"}`}>
                      {photo ? (
                        <img src={photo} alt={conv.ad?.title} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-lup-100 text-lup-700"><Recycle className="h-6 w-6" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="truncate font-extrabold text-lup-950">{conv.ad?.title || "Anúncio removido"}</p>
                          {hasUnread && (
                            <span className="ml-2 bg-lup-500 text-white text-xs px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-sm text-lup-600 mb-1">
                          <UserRound className="mr-1 inline h-3.5 w-3.5" /> {conv.isBuyer ? "Anunciante" : "Interessado"}: <span className="font-bold">{otherName}</span>
                        </p>
                        <p className={`text-sm truncate ${hasUnread ? "text-lup-900 font-medium" : "text-lup-500"}`}>{previewTruncated}</p>
                      </div>
                      <div className="hidden whitespace-nowrap text-xs text-lup-500 sm:block">
                        {new Date(conv.updated_at).toLocaleDateString("pt-PT")}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-lup-400" />
                    </article>
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
