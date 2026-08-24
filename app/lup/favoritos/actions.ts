"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Alterna o estado de favorito de um anúncio do Lup.
 * Reutiliza a mesma tabela marketplace_favorites do Mercado da Terra e do
 * Gran Bazar (é genérica, ligada só por ad_id) — só os revalidatePath
 * mudam, para apontar às páginas do Lup.
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

  const { data: existing } = await supabase
    .from("marketplace_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("ad_id", adId)
    .maybeSingle();

  if (existing) {
    await supabase.from("marketplace_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("marketplace_favorites").insert({ user_id: user.id, ad_id: adId });
  }

  revalidatePath("/lup");
  revalidatePath(`/lup/${adId}`);
  revalidatePath("/lup/favoritos");
}
