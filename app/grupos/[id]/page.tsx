import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationUpdates } from "@/components/social/conversation-updates";
import {
  DeleteGroupMessage, GroupMessageForm, InviteForm, InviteResponse,
  LeaveGroupButton, MemberActions, TransferOwnershipForm,
} from "@/components/social/group-controls";
import { groupSession, pendingInvite } from "@/lib/social/groups";
import { isUuid } from "@/lib/social/messages";

export default async function GroupPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }>;
}) {
  const { id } = await params;
  const { before } = await searchParams;
  const session = await groupSession(id);

  if (!session) {
    const invite = await pendingInvite(id);
    if (!invite) notFound();
    return <>
      <h1 className="text-2xl font-bold">Convite para um grupo</h1>
      <p>Tens um convite pendente para entrares neste grupo como {invite.role === "admin" ? "admin" : invite.role === "moderator" ? "moderador" : "membro"}.</p>
      <InviteResponse inviteId={invite.id} groupId={id} />
    </>;
  }

  const { db, user, group, conversationId } = session;

  const { data: memberRows, error: membersError } = await db.from("group_members")
    .select("user_id, role, joined_at, profiles(username, display_name)")
    .eq("group_id", id).order("role", { ascending: true });
  if (membersError) throw new Error("Não foi possível carregar os membros.");

  // A relação profiles(...) pode vir como objeto ou como array de um
  // elemento consoante a resolução do PostgREST -- normalizar (mesmo
  // padrão já usado em lib/freguesia/actions.ts).
  const members = (memberRows || []).map(m => {
    const raw = m.profiles as unknown;
    const profile = (Array.isArray(raw) ? raw[0] : raw) as { username?: string; display_name?: string } | null;
    return { ...m, profile };
  });

  const me = members.find(m => m.user_id === user.id);
  const canManage = me?.role === "owner" || me?.role === "admin";
  const isOwner = group.owner_id === user.id;

  let messages: { id: string; sender_id: string; content: string | null; created_at: string; deleted_at: string | null; media: { id: string; url: string | null }[] }[] = [];
  let hasMore = false;
  if (conversationId) {
    const query = db.from("messages").select("id, sender_id, content, created_at, deleted_at, message_media(id,storage_provider)")
      .eq("conversation_id", conversationId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
    if (before) {
      if (!isUuid(before)) notFound();
      const { data: cursor, error } = await db.from("messages").select("id,created_at").eq("conversation_id", conversationId).eq("id", before).maybeSingle();
      if (error) throw new Error("Não foi possível carregar o histórico.");
      if (!cursor) notFound();
      query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    }
    const { data, error } = await query;
    if (error) throw new Error("Não foi possível carregar as mensagens.");
    const rows = (data || []);
    hasMore = rows.length > 50;
    messages = rows.slice(0, 50).reverse().map(m => ({
      ...m,
      media: m.deleted_at ? [] : m.message_media.map(media => ({
        id: media.id,
        url: media.storage_provider === "supabase" ? `/mensagens/anexos/${media.id}` : null,
      })),
    }));
  }

  const usernameFor = (userId: string) => {
    const profile = members.find(m => m.user_id === userId)?.profile;
    return profile?.display_name || profile?.username || "Utilizador";
  };

  return <>
    <h1 className="text-3xl font-bold">{group.name}</h1>
    {group.description && <p>{group.description}</p>}

    <section aria-label="Membros" className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Membros ({members.length})</h2>
      <ul className="space-y-2">{members.map(m => <li key={m.user_id} className="flex items-center justify-between gap-3">
        <span>{m.profile?.display_name || m.profile?.username || "Utilizador"}
          <span className="ml-2 text-sm text-gray-600">
            {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : m.role === "moderator" ? "Moderador" : "Membro"}
          </span>
        </span>
        {canManage && m.role !== "owner" && m.user_id !== user.id && <MemberActions groupId={id} userId={m.user_id} role={m.role} />}
      </li>)}</ul>
      {canManage && <InviteForm groupId={id} />}
      {isOwner && <TransferOwnershipForm groupId={id} members={members.filter(m => m.user_id !== user.id).map(m => (
        { userId: m.user_id, label: m.profile?.display_name || m.profile?.username || "Utilizador" }
      ))} />}
      {!isOwner && <LeaveGroupButton groupId={id} />}
    </section>

    <ConversationUpdates userId={user.id} />
    {before && <Link className="block underline" href={`/grupos/${id}`}>Ver mensagens recentes</Link>}
    {hasMore && <Link className="block underline" href={`/grupos/${id}?before=${messages[0]?.id}`}>Carregar mensagens anteriores</Link>}
    {!messages.length && <p>Ainda não há mensagens neste grupo. Diz olá!</p>}
    <ol className="space-y-3" aria-label="Histórico de mensagens">{messages.map(m => <li key={m.id} className={`max-w-[90%] rounded-xl border p-4 ${m.sender_id === user.id ? "ml-auto bg-green-50" : "mr-auto"}`}>
      <p className="text-sm font-semibold">{m.sender_id === user.id ? "Tu" : usernameFor(m.sender_id)}</p>
      {m.deleted_at ? <p className="italic">Mensagem apagada</p> : <>
        <p className="whitespace-pre-wrap break-words">{m.content}</p>
        {m.media.map(media => media.url ? <a key={media.id} className="block underline" href={media.url} target="_blank" rel="noopener noreferrer">Descarregar anexo</a> : <p key={media.id}>Anexo indisponível</p>)}
      </>}
      <time className="block text-xs" dateTime={m.created_at}>{new Date(m.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</time>
      {!m.deleted_at && m.sender_id === user.id && <DeleteGroupMessage groupId={id} messageId={m.id} />}
    </li>)}</ol>
    <GroupMessageForm groupId={id} />
  </>;
}
