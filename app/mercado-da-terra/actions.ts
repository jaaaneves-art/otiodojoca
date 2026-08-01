"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ==================== HELPERS ====================

async function uploadImage(file: File, adId: number, index: number): Promise<string | null> {
  const supabase = createClient();
  
  try {
    const fileName = `${adId}-${index}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${adId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("marketplace-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("marketplace-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

async function savePhotoMetadata(adId: number, storagePath: string, sortOrder: number): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("marketplace_photos")
    .insert({
      ad_id: adId,
      storage_path: storagePath,
      sort_order: sortOrder,
    });
}

async function removePhoto(photoId: number): Promise<void> {
  const supabase = createClient();

  const { data: photo, error: fetchError } = await supabase
    .from("marketplace_photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) {
    console.error("[removePhoto] Foto não encontrada:", photoId);
    return;
  }

  const url = photo.storage_path;
  const match = url.match(/marketplace-images\/(.+)$/);
  
  if (match && match[1]) {
    const storageFilePath = match[1];
    
    const { error: storageError } = await supabase.storage
      .from("marketplace-images")
      .remove([storageFilePath]);

    if (storageError) {
      console.error("[removePhoto] Erro ao apagar do Storage:", storageError);
    }
  }

  const { error: dbError } = await supabase
    .from("marketplace_photos")
    .delete()
    .eq("id", photoId);

  if (dbError) {
    console.error("[removePhoto] Erro ao apagar da tabela:", dbError);
  }
}

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

// ==================== CREATE ====================

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

  const imageCount = parseInt(formData.get("image_count") as string) || 0;

  if (imageCount > 0) {
    for (let i = 0; i < imageCount; i++) {
      const imageFile = formData.get(`image_${i}`) as File;
      if (imageFile) {
        const storagePath = await uploadImage(imageFile, ad.id, i);
        if (storagePath) {
          await savePhotoMetadata(ad.id, storagePath, i);
        }
      }
    }
  }

  redirect(`/mercado-da-terra/${ad.id}`);
}

// ==================== UPDATE ====================

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
    console.error("[updateAd] Erro ao atualizar:", error);
    throw new Error(`Erro ao atualizar: ${error.message}`);
  }

  // Remover fotos marcadas
  const removedIdsJson = formData.get("removed_photo_ids") as string;
  if (removedIdsJson) {
    try {
      const removedIds: number[] = JSON.parse(removedIdsJson);
      for (const photoId of removedIds) {
        await removePhoto(photoId);
      }
    } catch (e) {
      console.error("[updateAd] Erro ao processar remoções:", e);
    }
  }

  // Upload de novas imagens
  const imageCount = parseInt(formData.get("image_count") as string) || 0;

  if (imageCount > 0) {
    const { data: existingPhotos } = await supabase
      .from("marketplace_photos")
      .select("sort_order")
      .eq("ad_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const startOrder = existingPhotos && existingPhotos.length > 0
      ? existingPhotos[0].sort_order + 1
      : 0;

    for (let i = 0; i < imageCount; i++) {
      const imageFile = formData.get(`image_${i}`) as File;
      if (imageFile) {
        const storagePath = await uploadImage(imageFile, id, startOrder + i);
        if (storagePath) {
          await savePhotoMetadata(id, storagePath, startOrder + i);
        }
      }
    }
  }

  redirect(`/mercado-da-terra/${id}`);
}

// ==================== STATUS CHANGES (F9) ====================

async function changeStatus(id: number, newStatus: "active" | "sold" | "inactive") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilizador nao autenticado");
  }

  const { error } = await supabase
    .from("marketplace_ads")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    console.error(`[changeStatus ${newStatus}] Erro:`, error);
    throw new Error(`Erro ao atualizar estado: ${error.message}`);
  }

  revalidatePath("/mercado-da-terra");
  revalidatePath("/mercado-da-terra/meus-anuncios");
  revalidatePath(`/mercado-da-terra/${id}`);
}

export async function markAsSold(id: number) {
  await changeStatus(id, "sold");
}

export async function markAsInactive(id: number) {
  await changeStatus(id, "inactive");
}

export async function reactivate(id: number) {
  await changeStatus(id, "active");
}
