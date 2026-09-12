import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/social/messages";
import { MAX_MEDIA_BYTES, MEDIA_BUCKET, POST_IMAGE_TYPES } from "@/lib/social/media";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Vary": "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; sandbox",
};

const unavailable = (status = 404) => new Response("Imagem indisponível.", { status, headers: PRIVATE_HEADERS });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return unavailable();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return unavailable(401);

  const findMedia = () => db.from("social_post_media")
    .select("id,storage_key,mime_type,size_bytes,social_posts!inner(deleted_at,visibility)")
    .eq("id", id)
    .eq("storage_provider", "supabase")
    .is("social_posts.deleted_at", null)
    .eq("social_posts.visibility", "public")
    .maybeSingle();

  try {
    const { data: media, error } = await findMedia();
    if (error) return unavailable(503);
    if (!media || !POST_IMAGE_TYPES.includes(media.mime_type) || media.size_bytes > MAX_MEDIA_BYTES) return unavailable();

    const { data: signed, error: signError } = await db.storage.from(MEDIA_BUCKET)
      .createSignedUrl(media.storage_key, 30);
    if (signError || !signed) return unavailable();
    const response = await fetch(signed.signedUrl, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || !response.body) return unavailable();

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MEDIA_BYTES) {
        await reader.cancel();
        return unavailable();
      }
      chunks.push(value);
    }

    const current = await findMedia();
    if (current.error) return unavailable(503);
    if (!current.data || current.data.storage_key !== media.storage_key) return unavailable();

    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(body, { headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": media.mime_type,
      "Content-Length": String(size),
      "Content-Disposition": `inline; filename="publicacao-${id}"`,
    } });
  } catch {
    return unavailable(503);
  }
}
