/* Manual PWA worker. Bump VERSION whenever the precached files/policy change. */
const VERSION = "v1";
const PREFIX = "otj-pwa-";
const CORE_CACHE = `${PREFIX}${VERSION}-core`;
const STATIC_CACHE = `${PREFIX}${VERSION}-static`;
const OFFLINE = "/offline.html";
const CORE = new Set([
  OFFLINE,
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
]);
// Only these exact public landing pages get a navigation fallback. Unknown,
// private and nested routes are left entirely to the browser/server.
const PUBLIC_NAVIGATIONS = new Set([
  "/", "/forum", "/calendario", "/comer", "/alojamento", "/freguesias",
  "/almanaque", "/gran-bazar", "/imoveis", "/lup", "/viaturas",
  "/mercado-da-terra", "/parceiros", "/espectaculos",
]);
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_STATIC_ENTRIES = 64;
let writes = Promise.resolve();

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function classify(request) {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.search || url.hash || url.username || url.password) return "ignore";
  // Presence is enough: even a header with value "0" is excluded.
  for (const name of request.headers.keys()) {
    if (/^(rsc|next-router-|next-action|next-url|x-nextjs-|x-middleware-prefetch$|purpose$|sec-purpose$|authorization$|cookie$|range$)/i.test(name)) return "ignore";
  }
  if (/text\/x-component/i.test(request.headers.get("accept") || "")) return "ignore";
  if (CORE.has(url.pathname)) return "core";
  // No maps, JSON, HTML, images, arbitrary extensions or query variants.
  if (/^\/_next\/static\/[A-Za-z0-9_./[\]@()-]+\.(?:js|css|woff2?)$/.test(url.pathname)) return "static";
  if (request.mode === "navigate" && request.destination === "document" &&
      PUBLIC_NAVIGATIONS.has(url.pathname)) return "navigation";
  return "ignore";
}

function assetRequest(url) {
  // Do not copy client headers, cookies, authorization, referrers or query data.
  return new Request(url, {
    credentials: "omit", mode: "same-origin", redirect: "error",
    cache: "no-store", referrerPolicy: "no-referrer",
  });
}

function cacheable(request, response, kind) {
  if (response.status !== 200 || response.type !== "basic" || response.redirected ||
      response.url !== request.url || response.headers.has("set-cookie")) return false;
  const control = response.headers.get("cache-control") || "";
  if (/(?:^|,)\s*(?:private|no-store)\b/i.test(control)) return false;
  if (response.headers.has("vary")) return false;
  if (kind === "static" && !/(?:^|,)\s*immutable\b/i.test(control)) return false;
  const path = new URL(request.url).pathname;
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (path === OFFLINE) return mime === "text/html";
  if (path.endsWith(".png")) return mime === "image/png";
  if (path.endsWith(".ico")) return ["image/x-icon", "image/vnd.microsoft.icon"].includes(mime);
  if (path.endsWith(".js")) return ["text/javascript", "application/javascript"].includes(mime);
  if (path.endsWith(".css")) return mime === "text/css";
  return ["font/woff", "font/woff2", "application/font-woff"].includes(mime);
}

async function storeAsset(cache, request, response, kind) {
  if (!cacheable(request, response, kind)) return false;
  if (Number(response.headers.get("content-length")) > MAX_BYTES) return false;
  const body = await response.clone().arrayBuffer();
  if (body.byteLength > MAX_BYTES) return false;
  // Set-Cookie is browser-filtered and cannot reliably be inspected. Anonymous
  // fixed static endpoints plus a NEW response with only these headers ensure
  // no hidden response headers/cookies are copied into Cache Storage.
  const stored = new Response(body, { headers: {
    "Content-Type": response.headers.get("content-type"),
    "Cache-Control": response.headers.get("cache-control") || "no-cache",
  } });
  writes = writes.catch(() => {}).then(async () => {
    await cache.put(request, stored);
    if (kind === "static") {
      const keys = await cache.keys();
      for (const key of keys.slice(0, Math.max(0, keys.length - MAX_STATIC_ENTRIES))) await cache.delete(key);
    }
  });
  await writes;
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    for (const path of CORE) {
      try {
        const request = assetRequest(new URL(path, self.location.origin).href);
        const response = await fetch(request);
        // Development servers may send no-store headers. Keep the worker
        // installable, but never weaken the cache policy to accommodate them.
        await storeAsset(cache, request, response, "core");
      } catch {
        // A single unavailable asset must not prevent registration. Offline
        // fallback is used when its explicitly cached document is available.
      }
    }
  })());
  // No skipWaiting: an existing worker remains active until its clients close.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CORE_CACHE && name !== STATIC_CACHE) await caches.delete(name);
    }
  })());
  // No clients.claim: do not take over already-open pages silently.
});

async function navigation(request) {
  try {
    // HTTP errors (including 401/403/500) are returned unchanged, never cached.
    return await fetch(request);
  } catch (error) {
    // Fetch cannot distinguish disconnection from DNS/TLS/transport failures.
    // An aborted navigation must not be replaced by a fallback.
    if (request.signal.aborted || error.name === "AbortError") throw error;
    const cache = await caches.open(CORE_CACHE);
    const fallback = await cache.match(new URL(OFFLINE, self.location.origin).href);
    if (fallback) return fallback;
    throw error;
  }
}

async function asset(request, kind) {
  const clean = assetRequest(request.url);
  let cache;
  try {
    cache = await caches.open(kind === "core" ? CORE_CACHE : STATIC_CACHE);
    const cached = await cache.match(clean);
    if (cached) return cached;
  } catch { /* Storage unavailable: the online asset still works. */ }
  const response = await fetch(clean);
  if (cache) {
    try { await storeAsset(cache, clean, response, kind); }
    catch { /* Quota/storage failure must not break an online page. */ }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const kind = classify(event.request);
  if (kind === "ignore") return;
  event.respondWith(kind === "navigation" ? navigation(event.request) : asset(event.request, kind));
});
