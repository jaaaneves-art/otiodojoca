"use server";

import { revalidatePath } from "next/cache";
import { isUuid, socialSession } from "@/lib/social/messages";
import { groupSession } from "@/lib/social/groups";
import { MEDIA_BUCKET, validateMessageFile } from "@/lib/social/media";

export async function createGroup(form: FormData) {
  const { db } = await socialSession();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const imageUrl = String(form.get("image_url") || "").trim();
  if (!name || name.length > 120) return { error: "Indica um nome de grupo válido (até 120 caracteres)." };
  const { data: id, error } = await db.rpc("social_create_group", {
    p_name: name, p_description: description || null, p_image_url: imageUrl || null,
  });
  if (error || !id) return { error: "Não foi possível criar o grupo." };
  revalidatePath("/grupos");
  return { id: String(id) };
}

export async function inviteMember(groupId: string, form: FormData) {
  const { db, user } = await socialSession();
  if (!isUuid(groupId)) return { error: "Grupo indisponível." };
  const username = String(form.get("username") || "").trim().replace(/^@/, "");
  const role = String(form.get("role") || "member");
  if (!username || username.length > 80) return { error: "Indica um nome de utilizador válido." };
  if (!["admin", "moderator", "member"].includes(role)) return { error: "Papel inválido." };
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("id").eq("username", username).is("deleted_at", null).maybeSingle();
  if (profileError) return { error: "Não foi possível procurar o utilizador." };
  if (!profile || profile.id === user.id) return { error: "Escolhe outro utilizador existente." };
  const { error } = await db.rpc("social_invite_to_group", { p_group: groupId, p_invitee: profile.id, p_role: role });
  if (error) return { error: "Não foi possível convidar este utilizador. Confirma que és owner/admin do grupo." };
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function respondInvite(inviteId: string, groupId: string, accept: boolean) {
  const { db } = await socialSession();
  if (!isUuid(inviteId)) return { error: "Convite indisponível." };
  const { error } = await db.rpc("social_respond_group_invite", { p_invite: inviteId, p_accept: accept });
  if (error) return { error: "Não foi possível responder ao convite." };
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function leaveGroup(groupId: string) {
  const { db } = await socialSession();
  if (!isUuid(groupId)) return { error: "Grupo indisponível." };
  const { error } = await db.rpc("social_leave_group", { p_group: groupId });
  if (error) return { error: "Não foi possível sair do grupo. O owner tem de transferir a propriedade primeiro." };
  revalidatePath("/grupos");
  return { success: true };
}

export async function removeMember(groupId: string, userId: string) {
  const { db } = await socialSession();
  if (!isUuid(groupId) || !isUuid(userId)) return { error: "Pedido inválido." };
  const { error } = await db.rpc("social_manage_group_member", { p_group: groupId, p_user: userId, p_action: "remove" });
  if (error) return { error: "Não foi possível remover este membro." };
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function changeMemberRole(groupId: string, userId: string, role: string) {
  const { db } = await socialSession();
  if (!isUuid(groupId) || !isUuid(userId)) return { error: "Pedido inválido." };
  if (!["admin", "moderator", "member"].includes(role)) return { error: "Papel inválido." };
  const { error } = await db.rpc("social_manage_group_member", { p_group: groupId, p_user: userId, p_action: "role", p_role: role });
  if (error) return { error: "Não foi possível alterar o papel deste membro." };
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function transferOwnership(groupId: string, newOwnerId: string) {
  const { db } = await socialSession();
  if (!isUuid(groupId) || !isUuid(newOwnerId)) return { error: "Pedido inválido." };
  const { error } = await db.rpc("social_transfer_group_owner", { p_group: groupId, p_new_owner: newOwnerId });
  if (error) return { error: "Não foi possível transferir a propriedade do grupo." };
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function sendGroupMessage(groupId: string, form: FormData) {
  const session = await groupSession(groupId);
  if (!session || !session.conversationId) return { error: "Grupo indisponível." };
  const { db, user, conversationId } = session;
  const content = String(form.get("content") || "").trim();
  const candidate = form.get("file");
  const file = candidate instanceof File && (candidate.size > 0 || candidate.name !== "") ? candidate : null;
  if (content.length > 5000 || (!content && !file)) return { error: "Escreve uma mensagem (até 5000 caracteres) ou escolhe um anexo." };
  if (file) {
    const validationError = await validateMessageFile(file);
    if (validationError) return { error: validationError };
  }
  const key = file ? `${conversationId}/${user.id}/${crypto.randomUUID()}` : null;
  try {
    if (file && key) {
      const { error } = await db.storage.from(MEDIA_BUCKET).upload(key, file, {
        contentType: file.type, upsert: false, cacheControl: "0",
      });
      if (error) throw new Error("upload");
    }
    const { error } = await db.rpc("social_send_message", {
      p_conversation: conversationId, p_content: content, p_key: key,
      p_mime: file?.type ?? null, p_size: file?.size ?? null,
    });
    if (error) throw new Error("send");
  } catch {
    if (key) {
      try { await db.rpc("social_abandon_upload", { p_key: key }); }
      catch { /* Scheduled orphan sweep recovers failed compensations after 24h. */ }
    }
    return { error: "Não foi possível confirmar o envio. Verifica o grupo antes de tentar novamente; o texto foi preservado." };
  }
  revalidatePath(`/grupos/${groupId}`, "page");
  return { success: true };
}

export async function deleteGroupMessage(groupId: string, messageId: string) {
  const session = await groupSession(groupId);
  if (!session || !session.conversationId || !isUuid(messageId)) return { error: "Mensagem indisponível." };
  const { db, user, conversationId } = session;
  const { data, error } = await db.from("messages").update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId).eq("conversation_id", conversationId).eq("sender_id", user.id).is("deleted_at", null).select("id");
  if (error || !data?.length) return { error: "Não foi possível apagar a mensagem." };
  revalidatePath(`/grupos/${groupId}`, "page");
  return { success: true };
}
