import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { markAsRead } from "@/app/lup/mensagens/actions";
import MessageForm from "@/components/lup/message-form";
import { ArrowLeft, ChevronRight, FileText, MapPin, Recycle, UserRound } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(184,245,207,0.5),_transparent_30rem),#f7fff9]">
      <nav className="sticky top-0 z-10 border-b border-lup-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/lup/mensagens" aria-label="Voltar às mensagens" className="grid h-10 w-10 place-items-center rounded-xl border border-lup-200 text-lup-700 transition hover:bg-lup-50 hover:text-lup-950"><ArrowLeft className="h-5 w-5" /></Link>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lup-100 text-lup-700"><UserRound className="h-5 w-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="truncate font-extrabold text-lup-950">{otherParty?.username || "Utilizador"}</p>
            <p className="text-xs font-medium text-lup-600">{isBuyer ? "Anunciante" : "Interessado"}</p>
          </div>
        </div>
      </nav>

      <div className="border-b border-lup-200 bg-white px-4 py-3 sm:px-6">
        <Link href={`/lup/${conv.ad_id}`}>
          <div className="mx-auto flex max-w-3xl cursor-pointer items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-lup-50">
            {photo ? (
              <img src={photo.storage_path} alt={ad?.title} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-lup-100 text-lup-700"><Recycle className="h-5 w-5" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-extrabold text-lup-950">{ad?.title || "Anúncio"}</p>
              <p className="text-xs text-lup-600">
                {ad?.price_type === "free" || ad?.price == null ? "Grátis" : "€" + ad?.price.toFixed(2)}
                {ad?.location && <><span className="mx-1">•</span><MapPin className="inline h-3 w-3" /> {ad.location}</>}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-lup-600">Ver <ChevronRight className="h-3.5 w-3.5" /></div>
          </div>
        </Link>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-7 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((msg: any) => {
              const isMe = msg.sender_id === user.id;
              const msgAttachments = attachmentsMap[msg.id] || [];
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                    isMe ? "rounded-br-sm bg-lup-700 text-white" : "rounded-bl-sm border border-lup-200 bg-white text-lup-950"
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
                              <FileText className="h-5 w-5" />
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

      <div className="sticky bottom-0 border-t border-lup-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,74,44,0.06)] backdrop-blur-xl sm:p-4">
        <div className="max-w-3xl mx-auto">
          <MessageForm conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
