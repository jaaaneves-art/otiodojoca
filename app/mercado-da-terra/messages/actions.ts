"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ==================== HELPER: upload de anexos ====================

async function uploadAttachments(formData: FormData, messageId: number): Promise<void> {
  const supabase = createClient();

  const attachmentCount = parseInt(formData.get("attachment_count") as string) || 0;
  if (attachmentCount === 0) return;

  for (let i = 0; i < attachmentCount; i++) {
    const file = formData.get(`attachment_${i}`) as File;
    if (!file) continue;

    try {
      const cleanName = file.name.replace(/\s+/g, "-");
      const filePath = `${messageId}/${Date.now()}-${i}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[uploadAttachments] Erro no upload:", uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(filePath);

      await supabase
        .from("marketplace_message_attachments")
        .insert({
          message_id: messageId,
          storage_path: data.publicUrl,
          file_name: file.name,
          file_type: file.type,
        });
    } catch (e) {
      console.error("[uploadAttachments] Excecao:", e);
    }
  }
}

// ==================== START CONVERSATION ====================

export async function startConversation(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const adId = parseInt(formData.get("adId") as string);
  const content = (formData.get("content") as string)?.trim();
  const attachmentCount = parseInt(formData.get("attachment_count") as string) || 0;

  // Permitir enviar só com anexos (sem texto) desde que haja pelo menos um dos dois
  if (!adId || (!content && attachmentCount === 0)) {
    throw new Error("Dados invalidos");
  }

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .select("author_id")
    .eq("id", adId)
    .single();

  if (adError || !ad) {
    throw new Error("Anuncio nao encontrado");
  }

  if (ad.author_id === user.id) {
    throw new Error("Nao podes enviar mensagem para o teu proprio anuncio");
  }

  const { data: existing } = await supabase
    .from("marketplace_conversations")
    .select("id")
    .eq("ad_id", adId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  let conversationId: number;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: convError } = await supabase
      .from("marketplace_conversations")
      .insert({
        ad_id: adId,
        buyer_id: user.id,
        seller_id: ad.author_id,
      })
      .select("id")
      .single();

    if (convError || !newConv) {
      throw new Error("Erro ao iniciar conversa");
    }

    conversationId = newConv.id;
  }

  const { data: newMsg, error: msgError } = await supabase
    .from("marketplace_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || "",
    })
    .select("id")
    .single();

  if (msgError || !newMsg) {
    throw new Error("Erro ao enviar mensagem");
  }

  // Upload de anexos (se houver)
  await uploadAttachments(formData, newMsg.id);

  await supabase
    .from("marketplace_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  redirect(`/mercado-da-terra/messages/${conversationId}`);
}

// ==================== SEND MESSAGE ====================

export async function sendMessage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const conversationId = parseInt(formData.get("conversationId") as string);
  const content = (formData.get("content") as string)?.trim();
  const attachmentCount = parseInt(formData.get("attachment_count") as string) || 0;

  if (!conversationId || (!content && attachmentCount === 0)) {
    throw new Error("Dados invalidos");
  }

  const { data: conv } = await supabase
    .from("marketplace_conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!conv) {
    throw new Error("Conversa nao encontrada");
  }

  const { data: newMsg, error } = await supabase
    .from("marketplace_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || "",
    })
    .select("id")
    .single();

  if (error || !newMsg) {
    throw new Error("Erro ao enviar mensagem");
  }

  // Upload de anexos (se houver)
  await uploadAttachments(formData, newMsg.id);

  await supabase
    .from("marketplace_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/mercado-da-terra/messages/${conversationId}`);
  revalidatePath("/mercado-da-terra/messages");
}

// ==================== MARK AS READ ====================

export async function markAsRead(conversationId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("marketplace_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  revalidatePath("/mercado-da-terra/messages");
}
