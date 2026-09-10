import Link from "next/link";
import { ConversationUpdates } from "@/components/social/conversation-updates";
import { socialSession } from "@/lib/social/messages";
import { MessageForm } from "@/components/social/message-controls";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ page?: string; username?: string }> }) {
  const { db, user } = await socialSession();
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Number(params.page) || 1)) | 0;
  const { data: conversations, error } = await db.from("conversations")
    .select("id, direct_user_a, direct_user_b, updated_at, conversation_participants(user_id,last_read_at)")
    .eq("type", "direct").order("updated_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 20, page * 20);
  if (error) throw new Error("Não foi possível carregar as conversas.");
  const rows = (conversations || []).slice(0, 20);
  const otherIds = rows.map(c => c.direct_user_a === user.id ? c.direct_user_b : c.direct_user_a);
  const profiles = otherIds.length ? await db.from("profiles").select("id, username").in("id", otherIds) : { data: [], error: null };
  if (profiles.error) throw new Error("Não foi possível carregar os participantes.");
  const items = await Promise.all(rows.map(async c => {
    const own = c.conversation_participants.find(p => p.user_id === user.id);
    const unread = db.from("messages").select("id", { count: "exact", head: true })
      .eq("conversation_id", c.id).neq("sender_id", user.id).is("deleted_at", null);
    if (own?.last_read_at) unread.gt("created_at", own.last_read_at);
    const [last, count] = await Promise.all([
      db.from("messages").select("content, deleted_at, message_type").eq("conversation_id", c.id)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
      unread,
    ]);
    if (last.error || count.error) throw new Error("Não foi possível carregar as mensagens.");
    const otherId = c.direct_user_a === user.id ? c.direct_user_b : c.direct_user_a;
    return { ...c, username: profiles.data?.find(p => p.id === otherId)?.username || "Utilizador", last: last.data, unread: count.count || 0 };
  }));
  const { data: notifications, count: notificationCount, error: notificationError } = await db.from("notifications")
    .select("id, message, link", { count: "exact" }).eq("user_id", user.id).eq("type", "message")
    .not("social_message_id", "is", null).eq("is_read", false)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(5);
  return <>
    <h1 className="text-3xl font-bold">Mensagens privadas</h1>
    <section aria-label="Notificações de mensagens" className="space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">Notificações de mensagens{!notificationError && ` (${notificationCount || 0} por ler)`}</h2>
      {notificationError ? <p role="status">Não foi possível carregar as notificações.</p> : <>
        {!notifications?.length && <p>Não tens novas notificações de mensagens.</p>}
        <ul>{notifications?.map(notification => <li key={notification.id}>
          <Link className="underline" href={notification.link || "/mensagens"}>{notification.message}</Link>
        </li>)}</ul>
      </>}
    </section>
    <MessageForm initialUsername={String(params.username ?? "").slice(0, 80)} />
    <ConversationUpdates userId={user.id} />
    {items.length === 0 && <p>Ainda não há conversas nesta página. Inicia uma conversa pelo nome de utilizador.</p>}
    <ul className="space-y-3">{items.map(c => <li key={c.id}>
      <Link href={`/mensagens/${c.id}`} className="block rounded-xl border p-4 hover:bg-green-50">
        <span className="font-semibold">@{c.username}</span>
        {c.unread > 0 && <span className="ml-3 rounded bg-green-100 px-2">{c.unread} por ler</span>}
        <p className="truncate">{c.last?.deleted_at ? "Mensagem apagada" : c.last?.content || (c.last ? "Anexo" : "Sem mensagens")}</p>
        <time className="text-sm" dateTime={c.updated_at}>{new Date(c.updated_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</time>
      </Link>
    </li>)}</ul>
    <nav className="flex gap-4" aria-label="Páginas de conversas">
      {page > 1 && <Link href={`/mensagens?page=${page - 1}`}>Anterior</Link>}
      {(conversations?.length || 0) > 20 && <Link href={`/mensagens?page=${page + 1}`}>Seguinte</Link>}
    </nav>
  </>;
}
