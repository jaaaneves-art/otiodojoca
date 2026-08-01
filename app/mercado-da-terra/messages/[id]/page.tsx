import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { markAsRead } from "@/app/mercado-da-terra/messages/actions";
import MessageForm from "@/components/mercado-da-terra/message-form";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = parseInt(params.id);
  if (isNaN(conversationId)) {
    notFound();
  }

  // Buscar conversa (sem JOIN com profiles - FKs apontam para auth.users)
  const { data: conv, error } = await supabase
    .from("marketplace_conversations")
    .select(`
      id,
      ad_id,
      buyer_id,
      seller_id,
      ad:marketplace_ads(id, title, price, price_type, status, location)
    `)
    .eq("id", conversationId)
    .single();

  if (error || !conv) {
    notFound();
  }

  // Buscar perfis do buyer e seller separadamente
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", [conv.buyer_id, conv.seller_id]);

  const buyerProfile = profiles?.find((p: any) => p.id === conv.buyer_id);
  const sellerProfile = profiles?.find((p: any) => p.id === conv.seller_id);

  // Marcar mensagens recebidas como lidas
  await markAsRead(conversationId);

  // Buscar todas as mensagens
  const { data: messages } = await supabase
    .from("marketplace_messages")
    .select("id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Buscar anexos de todas as mensagens desta conversa
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

  // Buscar foto do anúncio
  const { data: photo } = await supabase
    .from("marketplace_photos")
    .select("storage_path")
    .eq("ad_id", conv.ad_id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const isBuyer = conv.buyer_id === user.id;
  const otherParty: any = isBuyer ? sellerProfile : buyerProfile;
  const ad: any = conv.ad;

  return (
    <div className="min-h-screen bg-terra-50 flex flex-col">
      {/* Header (próprio da conversa - mantido de propósito) */}
      <nav className="bg-white border-b border-terra-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/mercado-da-terra/messages" className="text-terra-600 hover:text-terra-800">
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-terra-800 truncate">{otherParty?.username || "Utilizador"}</p>
            <p className="text-xs text-terra-500">{isBuyer ? "Vendedor" : "Comprador"}</p>
          </div>
        </div>
      </nav>

      {/* Anúncio (contexto) */}
      <div className="bg-white border-b border-terra-200 px-6 py-3">
        <Link href={`/mercado-da-terra/${conv.ad_id}`}>
          <div className="max-w-3xl mx-auto flex items-center gap-3 hover:bg-terra-50 -mx-2 px-2 py-1 rounded-lg cursor-pointer">
            {photo ? (
              <img src={photo.storage_path} alt={ad?.title} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-terra-100 rounded-lg flex items-center justify-center text-xl">
                📦
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-terra-800 truncate">{ad?.title || "Anúncio"}</p>
              <p className="text-xs text-terra-600">
                {ad?.price_type === "free" || ad?.price == null ? "Grátis" : "€" + ad?.price.toFixed(2)}
                {ad?.location && " • 📍 " + ad.location}
                {ad?.status === "sold" && " • ✓ Vendido"}
                {ad?.status === "inactive" && " • ⏸️ Inativo"}
              </p>
            </div>
            <div className="text-xs text-terra-500">Ver →</div>
          </div>
        </Link>
      </div>

      {/* Mensagens */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((msg: any) => {
              const isMe = msg.sender_id === user.id;
              const msgAttachments = attachmentsMap[msg.id] || [];
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-terra-600 text-white rounded-br-sm"
                      : "bg-white border border-terra-200 text-terra-900 rounded-bl-sm"
                  }`}>
                    {/* Texto (se houver) */}
                    {msg.content && (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}

                    {/* Anexos (se houver) */}
                    {msgAttachments.length > 0 && (
                      <div className={`flex flex-col gap-2 ${msg.content ? "mt-2" : ""}`}>
                        {msgAttachments.map((att: any) => {
                          const isImage = att.file_type?.startsWith("image/");
                          if (isImage) {
                            return (
                              <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={att.storage_path}
                                  alt={att.file_name}
                                  className="max-w-[220px] max-h-[220px] object-cover rounded-lg border border-terra-200 hover:opacity-90 transition"
                                />
                              </a>
                            );
                          }
                          // PDF ou outro ficheiro
                          return (
                            <a
                              key={att.id}
                              href={att.storage_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                                isMe
                                  ? "bg-terra-500 border-terra-400 hover:bg-terra-400"
                                  : "bg-terra-50 border-terra-200 hover:bg-terra-100"
                              }`}
                            >
                              <span className="text-xl">📄</span>
                              <span className={`text-sm truncate max-w-[160px] ${isMe ? "text-white" : "text-terra-800"}`}>
                                {att.file_name}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <p className={`text-xs mt-1 ${isMe ? "text-terra-100" : "text-terra-500"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-terra-500">
              Sem mensagens ainda. Envia a primeira!
            </div>
          )}
        </div>
      </main>

      {/* Formulário */}
      <div className="bg-white border-t border-terra-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <MessageForm conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
