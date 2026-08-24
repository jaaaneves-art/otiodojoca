import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { markAsRead } from "@/app/lup/mensagens/actions";
import MessageForm from "@/components/lup/message-form";

export default async function ConversationLupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = parseInt(idParam);
  if (isNaN(conversationId)) {
    notFound();
  }

  const { data: conv, error } = await supabase
    .from("marketplace_conversations")
    .select(`
      id, ad_id, buyer_id, seller_id,
      ad:marketplace_ads(id, title, price, price_type, status, location, module)
    `)
    .eq("id", conversationId)
    .single();

  if (error || !conv) {
    notFound();
  }

  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    notFound();
  }

  // Conversa de um anúncio de outro módulo — não pertence a esta secção.
  const ad: any = conv.ad;
  if (!ad || ad.module !== "lup") {
    notFound();
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", [conv.buyer_id, conv.seller_id]);

  const buyerProfile = profiles?.find((p: any) => p.id === conv.buyer_id);
  const sellerProfile = profiles?.find((p: any) => p.id === conv.seller_id);

  await markAsRead(conversationId);

  const { data: messages } = await supabase
    .from("marketplace_messages")
    .select("id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messageIds = (messages || []).map((m: any) => m.id);
  const attachmentsMap: Record<number, any[]> = {};
  if (messageIds.length > 0) {
    const { data: attachments } = await supabase
      .from("marketplace_message_attachments")
      .select("id, message_id, storage_path, file_name, file_type")
      .in("message_id", messageIds);

    attachments?.forEach((att: any) => {
      if (!attachmentsMap[att.message_id]) attachmentsMap[att.message_id] = [];
      attachmentsMap[att.message_id].push(att);
    });
  }

  const { data: photo } = await supabase
    .from("marketplace_photos")
    .select("storage_path")
    .eq("ad_id", conv.ad_id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const isBuyer = conv.buyer_id === user.id;
  const otherParty: any = isBuyer ? sellerProfile : buyerProfile;

  return (
    <div className="min-h-screen bg-lup-50 flex flex-col">
      <nav className="bg-white border-b border-lup-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/lup/mensagens" className="text-lup-700 hover:text-lup-900">←</Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lup-900 truncate">{otherParty?.username || "Utilizador"}</p>
            <p className="text-xs text-lup-500">{isBuyer ? "Anunciante" : "Interessado"}</p>
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-lup-200 px-6 py-3">
        <Link href={`/lup/${conv.ad_id}`}>
          <div className="max-w-3xl mx-auto flex items-center gap-3 hover:bg-lup-50 -mx-2 px-2 py-1 rounded-lg cursor-pointer">
            {photo ? (
              <img src={photo.storage_path} alt={ad?.title} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-lup-50 rounded-lg flex items-center justify-center text-xl">♻️</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-lup-900 truncate">{ad?.title || "Anúncio"}</p>
              <p className="text-xs text-lup-600">
                {ad?.price_type === "free" || ad?.price == null ? "Grátis" : "€" + ad?.price.toFixed(2)}
                {ad?.location && " • 📍 " + ad.location}
              </p>
            </div>
            <div className="text-xs text-lup-500">Ver →</div>
          </div>
        </Link>
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((msg: any) => {
              const isMe = msg.sender_id === user.id;
              const msgAttachments = attachmentsMap[msg.id] || [];
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe ? "bg-lup-500 text-white rounded-br-sm" : "bg-white border border-lup-200 text-lup-900 rounded-bl-sm"
                  }`}>
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    {msgAttachments.length > 0 && (
                      <div className={`flex flex-col gap-2 ${msg.content ? "mt-2" : ""}`}>
                        {msgAttachments.map((att: any) => {
                          const isImage = att.file_type?.startsWith("image/");
                          if (isImage) {
                            return (
                              <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer">
                                <img src={att.storage_path} alt={att.file_name} className="max-w-[220px] max-h-[220px] object-cover rounded-lg border border-lup-200 hover:opacity-90 transition" />
                              </a>
                            );
                          }
                          return (
                            <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${isMe ? "bg-lup-400 border-lup-300 hover:bg-lup-300" : "bg-lup-50 border-lup-200 hover:bg-lup-100"}`}>
                              <span className="text-xl">📄</span>
                              <span className={`text-sm truncate max-w-[160px] ${isMe ? "text-white" : "text-lup-800"}`}>{att.file_name}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isMe ? "text-lup-100" : "text-lup-500"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-lup-500">Sem mensagens ainda. Envia a primeira!</div>
          )}
        </div>
      </main>

      <div className="bg-white border-t border-lup-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <MessageForm conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
