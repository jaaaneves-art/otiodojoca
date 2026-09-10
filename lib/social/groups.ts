import { isUuid, socialSession } from "@/lib/social/messages";

export async function groupSession(id: string) {
  const { db, user } = await socialSession();
  if (!isUuid(id)) return null;
  const { data: group, error } = await db.from("groups")
    .select("id, name, description, image_url, owner_id, created_at")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o grupo.");
  if (!group) return null;
  const { data: conversation, error: conversationError } = await db.from("conversations")
    .select("id").eq("group_id", id).eq("type", "group").maybeSingle();
  if (conversationError) throw new Error("Não foi possível carregar a conversa do grupo.");
  return { db, user, group, conversationId: conversation?.id ?? null };
}

export async function pendingInvite(groupId: string) {
  const { db, user } = await socialSession();
  if (!isUuid(groupId)) return null;
  const { data, error } = await db.from("group_invites")
    .select("id, role, created_at, inviter_id")
    .eq("group_id", groupId).eq("invitee_id", user.id).eq("status", "pending").maybeSingle();
  if (error) throw new Error("Não foi possível carregar o convite.");
  return data;
}
