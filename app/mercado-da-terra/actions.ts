"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createAd(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const priceType = formData.get("priceType") as string;
  const categoryId = formData.get("categoryId") as string;
  const location = formData.get("location") as string;
  const contactMethod = formData.get("contactMethod") as string;

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .insert([
      {
        author_id: user.id,
        title,
        description,
        price: priceType === "free" || !price ? null : parseFloat(price),
        price_type: priceType,
        category_id: categoryId ? parseInt(categoryId) : null,
        location,
        contact_method: contactMethod,
        status: "active",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir:", error);
    throw new Error(`Erro ao publicar: ${error.message}`);
  }

  redirect(`/mercado-da-terra/${ad.id}`);
}

export async function updateAd(id: number, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const priceType = formData.get("priceType") as string;
  const categoryId = formData.get("categoryId") as string;
  const location = formData.get("location") as string;
  const contactMethod = formData.get("contactMethod") as string;

  const { error } = await supabase
    .from("marketplace_ads")
    .update({
      title,
      description,
      price: priceType === "free" || !price ? null : parseFloat(price),
      price_type: priceType,
      category_id: categoryId ? parseInt(categoryId) : null,
      location,
      contact_method: contactMethod,
    })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    console.error("Erro ao atualizar:", error);
    throw new Error(`Erro ao atualizar: ${error.message}`);
  }

  redirect(`/mercado-da-terra/${id}`);
}
