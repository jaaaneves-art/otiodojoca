"use server";

import { toggleFavoritoAction } from "@/lib/marketplace/favoritos-actions";

export async function toggleFavorite(formData: FormData) {
  return toggleFavoritoAction("mercado-da-terra", formData);
}
