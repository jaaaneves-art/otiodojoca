"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PET_KINDS, PET_SEX, PET_SIZE, PET_SPECIES, type PetPostStatus } from "@/lib/pets/types";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 4 * 1024 * 1024;

export type PetActionResult = { error?: string };

function text(form: FormData, name: string, max: number) {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validatePhotos(form: FormData) {
  const files = form.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > MAX_PHOTOS) return { files, error: `Escolhe no máximo ${MAX_PHOTOS} fotografias.` };
  for (const file of files) {
    if (!PHOTO_TYPES.has(file.type)) return { files, error: "As fotografias têm de ser JPG, PNG ou WEBP." };
    if (file.size > MAX_PHOTO_SIZE) return { files, error: "Cada fotografia pode ter no máximo 4 MB." };
  }
  return { files };
}

export async function createPetPost(form: FormData): Promise<PetActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sessão para publicar." };

  const submissionKey = text(form, "submission_key", 36);
  const kind = text(form, "kind", 20);
  const species = text(form, "species", 20);
  const sex = text(form, "sex", 20);
  const size = text(form, "size", 20);
  const title = text(form, "title", 120);
  const description = text(form, "description", 5000);
  const petName = text(form, "pet_name", 80);
  const ageLabel = text(form, "age_label", 60);
  const breed = text(form, "breed", 100);
  const color = text(form, "color", 100);
  const locationDetail = text(form, "location_detail", 180);
  const freguesiaId = Number(form.get("freguesia_id"));
  const eventAtRaw = text(form, "event_at", 40);
  const eventAt = eventAtRaw ? new Date(eventAtRaw) : null;
  const isUrgent = form.get("is_urgent") === "on";
  const photos = validatePhotos(form);

  if (!validUuid(submissionKey)) return { error: "Atualiza a página e tenta novamente." };
  if (!(kind in PET_KINDS)) return { error: "Escolhe o tipo de publicação." };
  if (!(species in PET_SPECIES)) return { error: "Escolhe o tipo de animal." };
  if (!(sex in PET_SEX)) return { error: "Escolhe uma opção válida para o sexo." };
  if (size && !(size in PET_SIZE)) return { error: "Escolhe um porte válido." };
  if (title.length < 5) return { error: "O título deve ter pelo menos 5 caracteres." };
  if (description.length < 30) return { error: "Conta um pouco mais — a descrição deve ter pelo menos 30 caracteres." };
  if (!Number.isSafeInteger(freguesiaId) || freguesiaId < 1) return { error: "Seleciona uma freguesia da lista." };
  if ((kind === "lost" || kind === "found") && (!eventAt || Number.isNaN(eventAt.getTime()))) {
    return { error: "Indica quando o animal foi visto pela última vez." };
  }
  if (photos.error) return { error: photos.error };

  const { data: freguesia } = await supabase.from("freguesias").select("id").eq("id", freguesiaId).eq("active", true).maybeSingle();
  if (!freguesia) return { error: "A freguesia selecionada não está disponível." };

  const { data: post, error: insertError } = await supabase.from("pet_posts").insert({
    author_id: user.id,
    submission_key: submissionKey,
    kind,
    status: "draft",
    title,
    description,
    pet_name: petName || null,
    species,
    sex,
    size: size || null,
    age_label: ageLabel || null,
    breed: breed || null,
    color: color || null,
    freguesia_id: freguesiaId,
    location_detail: locationDetail || null,
    event_at: kind === "lost" || kind === "found" ? eventAt?.toISOString() : null,
    is_urgent: kind === "help" && isUrgent,
  }).select("id").single();

  if (insertError || !post) {
    const { data: existing } = await supabase.from("pet_posts").select("id").eq("author_id", user.id).eq("submission_key", submissionKey).maybeSingle();
    if (existing) redirect(`/mundo-dos-patudos/${existing.id}`);
    return { error: "Não foi possível criar a publicação. Tenta novamente." };
  }

  const uploaded: string[] = [];
  for (const [index, file] of photos.files.entries()) {
    const extension = PHOTO_EXTENSIONS[file.type];
    const storagePath = `${user.id}/${post.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("pet-media").upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      if (uploaded.length) await supabase.storage.from("pet-media").remove(uploaded);
      await supabase.from("pet_posts").delete().eq("id", post.id).eq("author_id", user.id).eq("status", "draft");
      return { error: "Não foi possível guardar as fotografias. A publicação não foi criada." };
    }
    uploaded.push(storagePath);
    const { error: photoError } = await supabase.from("pet_photos").insert({
      post_id: post.id,
      uploader_id: user.id,
      storage_path: storagePath,
      sort_order: index,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (photoError) {
      await supabase.storage.from("pet-media").remove([storagePath]);
      await supabase.storage.from("pet-media").remove(uploaded.filter((path) => path !== storagePath));
      await supabase.from("pet_posts").delete().eq("id", post.id).eq("author_id", user.id).eq("status", "draft");
      return { error: "Não foi possível concluir a publicação. Nenhum anúncio ficou ativo." };
    }
  }

  const { data: published, error: publishError } = await supabase.from("pet_posts").update({ status: "published" }).eq("id", post.id).eq("author_id", user.id).eq("status", "draft").select("id");
  if (publishError || !published?.length) return { error: "A publicação ficou guardada como rascunho. Tenta geri-la novamente mais tarde." };

  revalidatePath("/mundo-dos-patudos", "layout");
  redirect(`/mundo-dos-patudos/${post.id}`);
}

export async function setPetPostStatus(id: string, status: PetPostStatus): Promise<PetActionResult> {
  if (!validUuid(id) || !["published", "resolved", "archived"].includes(status)) return { error: "Pedido inválido." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sessão para gerir a publicação." };
  const { data, error } = await supabase.from("pet_posts").update({ status }).eq("id", id).eq("author_id", user.id).select("id");
  if (error || !data?.length) return { error: "Não foi possível atualizar a publicação." };
  revalidatePath("/mundo-dos-patudos", "layout");
  revalidatePath(`/mundo-dos-patudos/${id}`);
  return {};
}

export async function updatePetPost(id: string, form: FormData): Promise<PetActionResult> {
  if (!validUuid(id)) return { error: "Publicação inválida." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sessão para editar." };
  const kind = text(form, "kind", 20);
  const species = text(form, "species", 20);
  const sex = text(form, "sex", 20);
  const size = text(form, "size", 20);
  const title = text(form, "title", 120);
  const description = text(form, "description", 5000);
  const petName = text(form, "pet_name", 80);
  const ageLabel = text(form, "age_label", 60);
  const breed = text(form, "breed", 100);
  const color = text(form, "color", 100);
  const locationDetail = text(form, "location_detail", 180);
  const freguesiaId = Number(form.get("freguesia_id"));
  const eventAtRaw = text(form, "event_at", 40);
  const eventAt = eventAtRaw ? new Date(eventAtRaw) : null;
  const isUrgent = form.get("is_urgent") === "on";
  if (!(kind in PET_KINDS) || !(species in PET_SPECIES) || !(sex in PET_SEX) || (size && !(size in PET_SIZE))) return { error: "Revê o tipo e as características do animal." };
  if (title.length < 5 || description.length < 30) return { error: "O título ou a descrição são demasiado curtos." };
  if (!Number.isSafeInteger(freguesiaId) || freguesiaId < 1) return { error: "Seleciona uma freguesia da lista." };
  if ((kind === "lost" || kind === "found") && (!eventAt || Number.isNaN(eventAt.getTime()))) return { error: "Indica quando o animal foi visto pela última vez." };
  const { data: freguesia } = await supabase.from("freguesias").select("id").eq("id", freguesiaId).eq("active", true).maybeSingle();
  if (!freguesia) return { error: "A freguesia selecionada não está disponível." };
  const { data, error } = await supabase.from("pet_posts").update({
    kind, title, description, pet_name: petName || null, species, sex, size: size || null,
    age_label: ageLabel || null, breed: breed || null, color: color || null,
    freguesia_id: freguesiaId, location_detail: locationDetail || null,
    event_at: kind === "lost" || kind === "found" ? eventAt?.toISOString() : null,
    is_urgent: kind === "help" && isUrgent,
  }).eq("id", id).eq("author_id", user.id).select("id");
  if (error || !data?.length) return { error: "Não foi possível guardar as alterações." };
  revalidatePath("/mundo-dos-patudos", "layout");
  revalidatePath(`/mundo-dos-patudos/${id}`);
  redirect(`/mundo-dos-patudos/${id}`);
}

export async function reportPetPost(id: string, form: FormData): Promise<PetActionResult> {
  if (!validUuid(id)) return { error: "Publicação inválida." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sessão para denunciar." };
  const reason = text(form, "reason", 20);
  const details = text(form, "details", 1000);
  if (!["incorrect", "unsafe", "fraud", "duplicate", "other"].includes(reason)) return { error: "Escolhe um motivo válido." };
  if (details && details.length < 3) return { error: "Acrescenta um pouco mais de informação." };
  const { error } = await supabase.from("pet_reports").insert({ post_id: id, reporter_id: user.id, reason, details: details || null });
  if (error?.code === "23505") return { error: "Já enviaste uma denúncia sobre esta publicação." };
  if (error) return { error: "Não foi possível enviar a denúncia." };
  return {};
}

export async function moderatePetReport(reportId: number, decision: "reviewed" | "dismissed", archivePost: boolean): Promise<PetActionResult> {
  if (!Number.isSafeInteger(reportId) || reportId < 1 || !["reviewed", "dismissed"].includes(decision)) return { error: "Pedido inválido." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sem autorização." };
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Sem autorização." };
  const { data: report, error } = await supabase.from("pet_reports").update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", reportId).eq("status", "pending").select("post_id").maybeSingle();
  if (error || !report) return { error: "A denúncia já foi tratada ou está indisponível." };
  if (archivePost) await supabase.from("pet_posts").update({ status: "archived" }).eq("id", report.post_id);
  revalidatePath("/admin/pets");
  revalidatePath("/mundo-dos-patudos", "layout");
  return {};
}

export async function moderatePetReportForm(reportId: number, decision: "reviewed" | "dismissed", archivePost: boolean): Promise<void> {
  await moderatePetReport(reportId, decision, archivePost);
}
