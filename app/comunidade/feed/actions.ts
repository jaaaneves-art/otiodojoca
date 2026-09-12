"use server";

import { revalidatePath } from "next/cache";
import { MEDIA_BUCKET, validatePostImage } from "@/lib/social/media";
import { isUuid, socialSession } from "@/lib/social/messages";

const FEED_PATH = "/comunidade/feed";

export async function createPost(form: FormData) {
  const { db, user } = await socialSession();
  const content = String(form.get("content") || "").trim();
  const candidate = form.get("image");
  const image = candidate instanceof File && (candidate.size > 0 || candidate.name !== "")
    ? candidate
    : null;

  if (!content || content.length > 3000) {
    return { error: "Escreve uma publicação entre 1 e 3000 caracteres." };
  }
  if (image) {
    const validationError = await validatePostImage(image);
    if (validationError) return { error: validationError };
  }

  const { data: postId, error: postError } = await db.rpc("social_create_post", {
    p_content: content,
  });
  if (postError || !postId) {
    return { error: postError?.code === "54000"
      ? "Publicaste muitas vezes num curto espaço de tempo. Tenta mais tarde."
      : "Não foi possível publicar. Tenta novamente." };
  }

  if (image) {
    const key = `${postId}/${user.id}/${crypto.randomUUID()}`;
    let uploaded = false;
    try {
      const { error: uploadError } = await db.storage.from(MEDIA_BUCKET).upload(key, image, {
        contentType: image.type,
        upsert: false,
        cacheControl: "0",
      });
      if (uploadError) throw new Error("upload");
      uploaded = true;

      const { error: mediaError } = await db.rpc("social_attach_post_media", {
        p_post: postId,
        p_key: key,
        p_mime: image.type,
        p_size: image.size,
      });
      if (mediaError) throw new Error("attach");
    } catch {
      // Uma resposta perdida pode esconder uma associação já concluída.
      const { data: existing } = await db.from("social_post_media")
        .select("id,storage_key").eq("post_id", postId).maybeSingle();
      if (!existing) {
        if (uploaded) {
          try { await db.rpc("social_abandon_upload", { p_key: key }); }
          catch { /* A limpeza programada recupera órfãos após 24 horas. */ }
        }
        try { await db.rpc("social_delete_post", { p_post: postId }); }
        catch { /* A publicação continua sem imagem e pode ser apagada no feed. */ }
        return { error: "Não foi possível associar a imagem. O texto foi preservado para tentares novamente." };
      } else if (uploaded && existing.storage_key !== key) {
        // Outro pedido idêntico ganhou a corrida e associou a sua imagem.
        try { await db.rpc("social_abandon_upload", { p_key: key }); }
        catch { /* A limpeza programada recupera o segundo objeto após 24 horas. */ }
      }
    }
  }

  revalidatePath(FEED_PATH);
  return { success: true };
}

export async function deletePost(postId: string) {
  if (!isUuid(postId)) return { error: "Publicação indisponível." };
  const { db } = await socialSession();
  const { data, error } = await db.rpc("social_delete_post", { p_post: postId });
  if (error || !data) return { error: "Não foi possível apagar esta publicação." };
  revalidatePath(FEED_PATH);
  return { success: true };
}

export async function createComment(postId: string, form: FormData) {
  if (!isUuid(postId)) return { error: "Publicação indisponível." };
  const content = String(form.get("content") || "").trim();
  if (!content || content.length > 1000) {
    return { error: "Escreve um comentário entre 1 e 1000 caracteres." };
  }
  const { db } = await socialSession();
  const { error } = await db.rpc("social_create_comment", {
    p_post: postId,
    p_content: content,
  });
  if (error) return { error: error.code === "54000"
    ? "Comentaste muitas vezes num curto espaço de tempo. Tenta mais tarde."
    : "Não foi possível comentar. Tenta novamente." };
  revalidatePath(FEED_PATH);
  revalidatePath(`${FEED_PATH}/${postId}`);
  return { success: true };
}

export async function deleteComment(postId: string, commentId: string) {
  if (!isUuid(postId) || !isUuid(commentId)) return { error: "Comentário indisponível." };
  const { db } = await socialSession();
  const { data, error } = await db.rpc("social_delete_comment", { p_comment: commentId });
  if (error || !data) return { error: "Não foi possível apagar este comentário." };
  revalidatePath(FEED_PATH);
  revalidatePath(`${FEED_PATH}/${postId}`);
  return { success: true };
}

export async function toggleReaction(postId: string, reaction: string) {
  if (!isUuid(postId) || !["like", "love", "useful"].includes(reaction)) {
    return { error: "Reação inválida." };
  }
  const { db } = await socialSession();
  const { data, error } = await db.rpc("social_toggle_reaction", {
    p_post: postId,
    p_reaction: reaction,
  });
  if (error) return { error: "Não foi possível registar a reação." };
  revalidatePath(FEED_PATH);
  revalidatePath(`${FEED_PATH}/${postId}`);
  return { reaction: typeof data === "string" ? data : null };
}
