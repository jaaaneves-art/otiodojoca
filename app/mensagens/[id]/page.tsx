import Link from "next/link";
import { notFound } from "next/navigation";
import { directConversation, isUuid, MEDIA_BUCKET } from "@/lib/social/messages";
import { ConversationUpdates, DeleteMessage, MessageForm } from "@/components/social/message-controls";

export default async function ConversationPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }>;
}) {
  const { id } = await params;
  const { before } = await searchParams;
  const session = await directConversation(id);
  if (!session) notFound();
  const { db, user, conversation } = session;
  const otherId = conversation.direct_user_a === user.id ? conversation.direct_user_b : conversation.direct_user_a;
  const { data: profile, error: profileError } = await db.from("profiles").select("username").eq("id", otherId).maybeSingle();
  if (profileError) throw new Error("Não foi possível carregar o participante.");
  const query = db.from("messages").select("id, sender_id, content, created_at, deleted_at, message_media(id,storage_provider,storage_key,mime_type)")
    .eq("conversation_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
  if (before) {
    if (!isUuid(before)) notFound();
    const { data: cursor, error } = await db.from("messages").select("id,created_at").eq("conversation_id", id).eq("id", before).maybeSingle();
    if (error) throw new Error("Não foi possível carregar o histórico.");
    if (!cursor) notFound();
    query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar as mensagens.");
  const messages = (data || []).slice(0, 50).reverse();
  const rendered = await Promise.all(messages.map(async m => ({
    ...m,
    media: m.deleted_at ? [] : await Promise.all(m.message_media.map(async media => {
      if (media.storage_provider !== "supabase") return { id: media.id, url: null };
      const { data: signed } = await db.storage.from(MEDIA_BUCKET).createSignedUrl(media.storage_key, 60, { download: true });
      return { id: media.id, url: signed?.signedUrl || null };
    })),
  })));
  return <>
    <h1 className="text-2xl font-bold">Conversa com @{profile?.username || "Utilizador"}</h1>
    <ConversationUpdates id={before ? undefined : id} latest={before ? undefined : messages.at(-1)?.id} />
    {before && <Link className="block underline" href={`/mensagens/${id}`}>Ver mensagens recentes</Link>}
    {(data?.length || 0) > 50 && <Link className="block underline" href={`/mensagens/${id}?before=${messages[0].id}`}>Carregar mensagens anteriores</Link>}
    {!messages.length && <p>Ainda não há mensagens. Diz olá!</p>}
    <ol className="space-y-3" aria-label="Histórico de mensagens">{rendered.map(m => <li key={m.id} className={`max-w-[90%] rounded-xl border p-4 ${m.sender_id === user.id ? "ml-auto bg-green-50" : "mr-auto"}`}>
      <p className="text-sm font-semibold">{m.sender_id === user.id ? "Tu" : `@${profile?.username || "Utilizador"}`}</p>
      {m.deleted_at ? <p className="italic">Mensagem apagada</p> : <>
        <p className="whitespace-pre-wrap break-words">{m.content}</p>
        {m.media.map(media => media.url ? <a key={media.id} className="block underline" href={media.url} target="_blank" rel="noopener noreferrer">Descarregar anexo</a> : <p key={media.id}>Anexo indisponível</p>)}
      </>}
      <time className="block text-xs" dateTime={m.created_at}>{new Date(m.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</time>
      {!m.deleted_at && m.sender_id === user.id && <DeleteMessage conversationId={id} messageId={m.id} />}
    </li>)}</ol>
    <MessageForm conversationId={id} />
  </>;
}
