import { createClient } from "@/lib/supabase/server";

export interface Ad {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number | null;
  price_type: "fixed" | "negotiable" | "free";
  location: string;
  municipality: string;
  district: string;
  images: string[];
  status: "active" | "inactive" | "sold" | "reserved" | "expired";
  contact_method: "message" | "phone" | "email" | "in_person";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  views_count: number;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  municipality?: string;
  priceType?: string;
  status?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Obtém lista de anúncios com filtros e paginação
 */
export async function getAds(filters: FilterOptions = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("marketplace_ads")
    .select(
      `
      *,
      author:profiles(id, username, avatar_url, bio, rating, total_reviews)
    `,
      { count: "exact" }
    )
    .eq("status", filters.status || "active");

  // Filtros
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.municipality) {
    query = query.eq("municipality", filters.municipality);
  }

  if (filters.priceType) {
    query = query.eq("price_type", filters.priceType);
  }

  if (filters.priceMin) {
    query = query.gte("price", filters.priceMin);
  }

  if (filters.priceMax) {
    query = query.lte("price", filters.priceMax);
  }

  // Ordenação
  switch (filters.sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price-low":
      query = query.order("price", { ascending: true });
      break;
    case "price-high":
      query = query.order("price", { ascending: false });
      break;
    case "views":
      query = query.order("views_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Paginação
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Erro ao buscar anúncios:", error);
    return { ads: [], count: 0, error };
  }

  return { ads: data || [], count: count || 0, error: null };
}

/**
 * Obtém um anúncio específico
 */
export async function getAdById(id: number) {
  const supabase = await createClient();

  // Incrementar contador de visualizações
  try { await supabase.rpc("increment_views", { ad_id: id }); } catch (e) { console.error(e); }

  const { data, error } = await supabase
    .from("marketplace_ads")
    .select(
      `
      *,
      author:profiles(id, username, avatar_url, bio, rating, total_reviews)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar anúncio:", error);
    return { ad: null, error };
  }

  return { ad: data, error: null };
}

/**
 * Cria um novo anúncio
 */
export async function createAd(
  data: Omit<Ad, "id" | "created_at" | "updated_at" | "views_count">
) {
  const supabase = await createClient();

  const { data: newAd, error } = await supabase
    .from("marketplace_ads")
    .insert([
      {
        ...data,
        views_count: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar anúncio:", error);
    return { ad: null, error };
  }

  return { ad: newAd, error: null };
}

/**
 * Atualiza um anúncio existente
 */
export async function updateAd(id: number, data: Partial<Ad>) {
  const supabase = await createClient();

  const { data: updatedAd, error } = await supabase
    .from("marketplace_ads")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar anúncio:", error);
    return { ad: null, error };
  }

  return { ad: updatedAd, error: null };
}

/**
 * Deleta um anúncio
 */
export async function deleteAd(id: number) {
  const supabase = await createClient();

  const { error } = await supabase.from("marketplace_ads").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar anúncio:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Obtém anúncios de um utilizador específico
 */
export async function getUserAds(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar anúncios do utilizador:", error);
    return { ads: [], error };
  }

  return { ads: data || [], error: null };
}

/**
 * Obtém anúncios similares (mesma categoria)
 */
export async function getSimilarAds(category: string, excludeId: number, limit = 6) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_ads")
    .select(
      `
      *,
      author:profiles(id, username, avatar_url)
    `
    )
    .eq("category", category)
    .eq("status", "active")
    .neq("id", excludeId)
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar anúncios similares:", error);
    return { ads: [], error };
  }

  return { ads: data || [], error: null };
}

/**
 * Obtém categorias disponíveis
 */
export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return { categories: [], error };
  }

  return { categories: data || [], error: null };
}

/**
 * Adiciona um anúncio aos favoritos
 */
export async function addToFavorites(userId: string, adId: number) {
  const supabase = await createClient();

  const { error } = await supabase.from("marketplace_favorites").insert([
    {
      user_id: userId,
      ad_id: adId,
    },
  ]);

  if (error && error.code !== "23505") {
    // 23505 = unique constraint violation (já existe)
    console.error("Erro ao adicionar aos favoritos:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Remove um anúncio dos favoritos
 */
export async function removeFromFavorites(userId: string, adId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("marketplace_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("ad_id", adId);

  if (error) {
    console.error("Erro ao remover dos favoritos:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Obtém favoritos de um utilizador
 */
export async function getUserFavorites(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_favorites")
    .select(
      `
      ad_id,
      marketplace_ads(*)
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao buscar favoritos:", error);
    return { favorites: [], error };
  }

  return { favorites: data || [], error: null };
}

/**
 * Verifica se um anúncio é favorito do utilizador
 */
export async function isFavorite(userId: string, adId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("ad_id", adId)
    .single();

  return !!data && !error;
}

/**
 * Cria uma conversa de mensagens
 */
export async function createConversation(
  adId: number,
  buyerId: string,
  sellerId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_conversations")
    .insert([
      {
        ad_id: adId,
        buyer_id: buyerId,
        seller_id: sellerId,
        status: "active",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar conversa:", error);
    return { conversation: null, error };
  }

  return { conversation: data, error: null };
}

/**
 * Envia uma mensagem
 */
export async function sendMessage(
  conversationId: number,
  senderId: string,
  content: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { message: null, error };
  }

  return { message: data, error: null };
}

/**
 * Cria uma avaliação
 */
export async function createReview(
  adId: number,
  reviewerId: string,
  reviewedId: string,
  rating: number,
  comment: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_reviews")
    .insert([
      {
        ad_id: adId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        rating,
        comment,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar avaliação:", error);
    return { review: null, error };
  }

  return { review: data, error: null };
}

/**
 * Obtém avaliações de um utilizador
 */
export async function getUserReviews(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_reviews")
    .select(
      `
      *,
      reviewer:profiles(username, avatar_url)
    `
    )
    .eq("reviewed_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar avaliações:", error);
    return { reviews: [], error };
  }

  return { reviews: data || [], error: null };
}

/**
 * Reporta um anúncio como spam/inapropriado
 */
export async function reportAd(
  adId: number,
  userId: string,
  reason: string,
  description: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketplace_reports")
    .insert([
      {
        ad_id: adId,
        reporter_id: userId,
        reason,
        description,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao reportar anúncio:", error);
    return { report: null, error };
  }

  return { report: data, error: null };
}
