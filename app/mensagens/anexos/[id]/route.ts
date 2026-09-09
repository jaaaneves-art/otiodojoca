import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/social/messages";
import { MAX_MEDIA_BYTES, MEDIA_BUCKET } from "@/lib/social/media";

export const dynamic = "force-dynamic";
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Vary": "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const unavailable = (status = 404) => new Response("Anexo indisponível.", { status, headers: PRIVATE_HEADERS });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return unavailable();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return unavailable(401);
  // RLS hides deleted/expired media, cleanup jobs and conversations of other users.
  const findMedia = () => db.from("message_media").select("id, message_id, storage_key, storage_provider, mime_type, messages!inner(deleted_at)")
    .eq("id", id).eq("storage_provider", "supabase").is("messages.deleted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).maybeSingle();
  try {
    const { data: media, error } = await findMedia();
    if (error) return unavailable(503);
    if (!media) return unavailable();
    // The signed URL stays on the server: a copied application link still needs
    // authentication and fresh authorization after soft delete. No redirect.
    const { data: signed, error: signError } = await db.storage.from(MEDIA_BUCKET)
      .createSignedUrl(media.storage_key, 30, { download: true });
    if (signError || !signed) return unavailable();
    const response = await fetch(signed.signedUrl, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.body) return unavailable();
    // Bound memory even for legacy/corrupt objects whose metadata is incorrect.
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MEDIA_BYTES) { await reader.cancel(); return unavailable(); }
      chunks.push(value);
    }
    // Check again after fetching so deletion during the fetch cannot expose data.
    const current = await findMedia();
    if (current.error) return unavailable(503);
    if (!current.data || current.data.storage_key !== media.storage_key) return unavailable();
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return new Response(body, { headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="anexo-${id}"`,
      "Content-Length": String(size),
      "Content-Security-Policy": "sandbox; default-src 'none'",
    } });
  } catch { return unavailable(503); }
}
