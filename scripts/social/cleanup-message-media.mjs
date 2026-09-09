#!/usr/bin/env node
// Local-only operator tool. Never reads .env files or discovers credentials.
// No mutation without --apply. Storage bytes are removed only via Storage API.
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
if (args.has("--help")) {
  console.log("SOCIAL_STORAGE_URL=http://127.0.0.1:54321 SOCIAL_STORAGE_SERVICE_ROLE_KEY=... node scripts/social/cleanup-message-media.mjs [--apply]");
  process.exit(0);
}
if ([...args].some(arg => arg !== "--apply")) throw new Error("Argumento desconhecido. Usa --help.");
const endpoint = process.env.SOCIAL_STORAGE_URL;
const key = process.env.SOCIAL_STORAGE_SERVICE_ROLE_KEY;
if (!endpoint || !key) throw new Error("Define SOCIAL_STORAGE_URL e SOCIAL_STORAGE_SERVICE_ROLE_KEY da instância local.");
const url = new URL(endpoint);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    !["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
  throw new Error("Este operador só aceita a raiz de uma instância Supabase em loopback.");
}
const apply = args.has("--apply");
const db = createClient(endpoint, key, { auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, redirect: "error", signal: AbortSignal.timeout(30000) }) },
});
const { data: jobs, error } = await db.rpc("social_claim_media_cleanup", { p_limit: 100, p_apply: apply });
if (error) throw new Error(`Não foi possível ${apply ? "reservar" : "listar"} candidatos (${error.code || "RPC"}).`);
console.log(JSON.stringify({ mode: apply ? "apply-local" : "dry-run", candidates: jobs?.length || 0 }));
let failures = 0;
for (const job of jobs || []) {
  // Logs contain no user IDs, object keys, message contents, tokens or signed URLs.
  if (!apply) { console.log(JSON.stringify({ reason: job.reason })); continue; }
  try {
    // Fresh check of the permanent claim, including retries after a lost response.
    const { data: claim, error: claimError } = await db.from("social_media_cleanup_jobs")
      .select("storage_key, attempts, completed_at").eq("storage_key", job.storage_key).maybeSingle();
    if (claimError || !claim) throw new Error("claim");
    if (claim.completed_at) continue;
    const { error: attemptError } = await db.from("social_media_cleanup_jobs")
      .update({ attempts: claim.attempts + 1, last_attempt_at: new Date().toISOString() }).eq("storage_key", job.storage_key);
    if (attemptError) throw new Error("attempt");
    const { error: removeError } = await db.storage.from("social-message-media").remove([job.storage_key]);
    if (removeError) throw new Error("remove");
    // An absent object is also success. On interruption, retrying remove is safe.
    const { error: finishError } = await db.from("social_media_cleanup_jobs")
      .update({ completed_at: new Date().toISOString() }).eq("storage_key", job.storage_key);
    if (finishError) throw new Error("finish");
    console.log(JSON.stringify({ reason: job.reason, result: "removed" }));
  } catch {
    failures += 1;
    console.error(JSON.stringify({ reason: job.reason, result: "retry-required" }));
  }
}
if (failures) process.exitCode = 1;
