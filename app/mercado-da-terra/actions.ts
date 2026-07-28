"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Constrói o objeto details conforme o tipo de anúncio
function buildDetails(type: string, formData: FormData): Record<string, any> {
  const details: Record<string, any> = {};

  if (type === "troca" || type === "procura") {
    const seeking = formData.get("seeking") as string;
    const seeking_description = formData.get("seeking_description") as string;
    if (seeking) {
      details.seeking = seeking;
    }
    if (seeking_description) {
      details.seeking_description = seeking_description;
    }
  }

  return details;
}

export async function createAd(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const priceType = formData.get("priceType") as string;
  const type = (formData.get("type") as string) || "sale";
  const categoryId = formData.get("categoryId") as string;
  const location = formData.get("location") as string;
  const contactMethod = formData.get("contactMethod") as string;
  const details = buildDetails(type, formData);

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .insert([
      {
        author_id: user.id,
        title,
        description,
        price: priceType === "free" || !price ? null : parseFloat(price),
        price_type: priceType,
        type,
        category_id: categoryId ? parseInt(categoryId) : null,
        location,
        contact_method: contactMethod,
        details,
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const priceType = formData.get("priceType") as string;
  const type = (formData.get("type") as string) || "sale";
  const categoryId = formData.get("categoryId") as string;
  const location = formData.get("location") as string;
  const contactMethod = formData.get("contactMethod") as string;
  const details = buildDetails(type, formData);

  const { error } = await supabase
    .from("marketplace_ads")
    .update({
      title,
      description,
      price: priceType === "free" || !price ? null : parseFloat(price),
      price_type: priceType,
      type,
      category_id: categoryId ? parseInt(categoryId) : null,
      location,
      contact_method: contactMethod,
      details,
    })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    console.error("Erro ao atualizar:", error);
    throw new Error(`Erro ao atualizar: ${error.message}`);
  }

  redirect(`/mercado-da-terra/${id}`);
}



