"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Alterna o estado de favorito de um anúncio.
 * Se já estiver nos favoritos, remove; senão, adiciona.
 */
export async function toggleFavorite(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const adId = parseInt(formData.get("adId") as string);
  if (!adId) {
    throw new Error("Anuncio invalido");
  }

  // Verificar se já é favorito
  const { data: existing } = await supabase
    .from("marketplace_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("ad_id", adId)
    .maybeSingle();

  if (existing) {
    // Remover dos favoritos
    await supabase
      .from("marketplace_favorites")
      .delete()
      .eq("id", existing.id);
  } else {
    // Adicionar aos favoritos
    await supabase
      .from("marketplace_favorites")
      .insert({ user_id: user.id, ad_id: adId });
  }

  revalidatePath("/mercado-da-terra");
  revalidatePath(`/mercado-da-terra/${adId}`);
  revalidatePath("/mercado-da-terra/favoritos");
}
