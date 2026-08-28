"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Equivalente ao startConversation/sendMessage/markAsRead do Gran Bazar e
 * do Lup — mesma lógica, sobre as mesmas tabelas
 * marketplace_conversations/marketplace_messages (genéricas, ligadas só
 * por ad_id). Só existe como ficheiro à parte porque o redirect e o
 * revalidatePath têm de apontar para /imoveis/mensagens.
 */
export async function startConversation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const adId = parseInt(formData.get("adId") as string);
  const content = (formData.get("content") as string)?.trim();

  if (!adId || !content) {
    throw new Error("Dados invalidos");
  }

  const { data: ad, error: adError } = await supabase
    .from("marketplace_ads")
    .select("author_id, module")
    .eq("id", adId)
    .single();

  if (adError || !ad || ad.module !== "imoveis") {
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
      .insert({ ad_id: adId, buyer_id: user.id, seller_id: ad.author_id })
      .select("id")
      .single();

    if (convError || !newConv) {
      throw new Error("Erro ao iniciar conversa");
    }

    conversationId = newConv.id;
  }

  const { error: msgError } = await supabase
    .from("marketplace_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, content });

  if (msgError) {
    throw new Error("Erro ao enviar mensagem");
  }

  await supabase
    .from("marketplace_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  redirect(`/imoveis/mensagens/${conversationId}`);
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const conversationId = parseInt(formData.get("conversationId") as string);
  const content = (formData.get("content") as string)?.trim();

  if (!conversationId || !content) {
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

  const { error } = await supabase
    .from("marketplace_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, content });

  if (error) {
    throw new Error("Erro ao enviar mensagem");
  }

  await supabase
    .from("marketplace_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/imoveis/mensagens/${conversationId}`);
  revalidatePath("/imoveis/mensagens");
}

export async function markAsRead(conversationId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("marketplace_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  // Sem revalidatePath aqui de propósito: esta função é chamada durante o
  // render da página da conversa (app/imoveis/mensagens/[id]/page.tsx), e
  // o Next.js 16 não permite revalidatePath durante o render -- dá "used
  // revalidatePath ... during render which is unsupported". O próprio
  // pedido já traz os dados frescos; a lista em /imoveis/mensagens já
  // corre sempre dinâmica (usa auth/cookies), não fica em cache.
}
