"use server";

import { revalidatePath } from "next/cache";
import { directConversation, isUuid, socialSession } from "@/lib/social/messages";
import { MEDIA_BUCKET, validateMessageFile } from "@/lib/social/media";

export async function startConversation(form: FormData) {
  const { db, user } = await socialSession();
  const username = String(form.get("username") || "").trim().replace(/^@/, "");
  if (!username || username.length > 80) return { error: "Indica um nome de utilizador válido." };
  const { data: profile, error } = await db.from("profiles").select("id").eq("username", username).is("deleted_at", null).maybeSingle();
  if (error) return { error: "Não foi possível procurar o utilizador." };
  if (!profile || profile.id === user.id) return { error: "Escolhe outro utilizador existente." };
  const { data: id, error: creationError } = await db.rpc("get_or_create_direct_conversation", { user_a: user.id, user_b: profile.id, p_module: null });
  if (creationError || !id) return { error: "Não foi possível iniciar a conversa." };
  revalidatePath("/mensagens");
  return { id: String(id) };
}

export async function sendMessage(id: string, form: FormData) {
  const session = await directConversation(id);
  if (!session) return { error: "Conversa indisponível." };
  const { db, user } = session;
  const content = String(form.get("content") || "").trim();
  const candidate = form.get("file");
  const file = candidate instanceof File && (candidate.size > 0 || candidate.name !== "") ? candidate : null;
  if (content.length > 5000 || (!content && !file)) return { error: "Escreve uma mensagem (até 5000 caracteres) ou escolhe um anexo." };
  if (file) {
    const validationError = await validateMessageFile(file);
    if (validationError) return { error: validationError };
  }
  const key = file ? `${id}/${user.id}/${crypto.randomUUID()}` : null;
  try {
    if (file && key) {
      const { error } = await db.storage.from(MEDIA_BUCKET).upload(key, file, {
        contentType: file.type, upsert: false, cacheControl: "0",
      });
      if (error) throw new Error("upload");
    }
    const { error } = await db.rpc("social_send_message", {
      p_conversation: id, p_content: content, p_key: key,
      p_mime: file?.type ?? null, p_size: file?.size ?? null,
    });
    if (error) throw new Error("send");
  } catch {
    // A lost response may hide a committed message. The RPC checks ALL references
    // under the same lock as association; never delete the object directly here.
    if (key) {
      try { await db.rpc("social_abandon_upload", { p_key: key }); }
      catch { /* Scheduled orphan sweep recovers failed compensations after 24h. */ }
    }
    return { error: "Não foi possível confirmar o envio. Verifica a conversa antes de tentar novamente; o texto foi preservado." };
  }
  revalidatePath("/mensagens", "layout");
  return { success: true };
}

export async function deleteMessage(conversationId: string, messageId: string) {
  const session = await directConversation(conversationId);
  if (!session || !isUuid(messageId)) return { error: "Mensagem indisponível." };
  const { db, user } = session;
  const { data, error } = await db.from("messages").update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId).eq("conversation_id", conversationId).eq("sender_id", user.id).is("deleted_at", null).select("id");
  if (error || !data?.length) return { error: "Não foi possível apagar a mensagem." };
  revalidatePath("/mensagens", "layout");
  return { success: true };
}

export async function markRead(id: string, messageId: string) {
  const session = await directConversation(id);
  if (!session || !isUuid(messageId)) return { error: "Conversa indisponível." };
  const { error } = await session.db.rpc("social_mark_read", { p_conversation: id, p_message: messageId });
  return error ? { error: "Não foi possível registar a leitura." } : { success: true };
}
