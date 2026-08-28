"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Inicia (ou reaproveita) uma conversa DIRETA entre dois stands
 * verificados -- sem anúncio associado (ad_id null), fora do fluxo
 * normal comprador->vendedor. Só acessível a quem já tem
 * profiles.is_stand_automovel = true (ativado pelo admin ao aprovar um
 * pedido de entidade parceira com CAE do setor automóvel -- ver
 * app/admin/entidades/actions.ts e a migration
 * 20260828140000_stand_automovel_contacto_direto.sql).
 */
export async function startStandConversation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_stand_automovel")
    .eq("id", user.id)
    .single();

  if (!profile?.is_stand_automovel) {
    throw new Error("Esta área é exclusiva para stands verificados.");
  }

  const otherId = formData.get("otherId") as string;
  if (!otherId || otherId === user.id) {
    throw new Error("Destinatário inválido");
  }

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("is_stand_automovel")
    .eq("id", otherId)
    .single();

  if (!otherProfile?.is_stand_automovel) {
    throw new Error("Este utilizador não é um stand verificado.");
  }

  // Já existe uma conversa direta entre este par? (RLS só devolve
  // conversas onde o utilizador atual é buyer_id ou seller_id, por isso
  // não é preciso repetir essa condição aqui.)
  const { data: existing } = await supabase
    .from("marketplace_conversations")
    .select("id")
    .is("ad_id", null)
    .or(`and(buyer_id.eq.${user.id},seller_id.eq.${otherId}),and(buyer_id.eq.${otherId},seller_id.eq.${user.id})`)
    .maybeSingle();

  let conversationId: number;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error } = await supabase
      .from("marketplace_conversations")
      .insert({ ad_id: null, module: "viaturas", buyer_id: user.id, seller_id: otherId })
      .select("id")
      .single();

    if (error || !newConv) {
      throw new Error("Erro ao iniciar conversa: " + error?.message);
    }

    conversationId = newConv.id;
  }

  redirect(`/viaturas/mensagens/${conversationId}`);
}
