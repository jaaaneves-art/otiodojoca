import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const origin = "https://pwa.example";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
function request(path, options = {}) {
  const { navigation = false, ...init } = options;
  const req = new Request(new URL(path, origin), init);
  if (navigation) Object.defineProperties(req, {
    mode: { value: "navigate" }, destination: { value: "document" },
  });
  return req;
}
function response(path, mime = "application/javascript", headers = {}, body = "asset") {
  const res = new Response(body, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable", ...headers } });
  Object.defineProperties(res, { type: { value: "basic", configurable: true }, url: { value: new URL(path, origin).href, configurable: true } });
  return res;
}
function worker() {
  const listeners = {}, stores = new Map(), calls = [];
  const key = (req) => typeof req === "string" ? req : req.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        async match(req) { return data.get(key(req))?.clone(); },
        async put(req, res) { data.set(key(req), res.clone()); },
        async keys() { return [...data.keys()].map((url) => new Request(url)); },
        async delete(req) { return data.delete(key(req)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const state = {
    fetch: async (req) => {
      const path = new URL(req.url).pathname;
      const mime = path.endsWith(".html") ? "text/html" : path.endsWith(".png") ? "image/png" : path.endsWith(".ico") ? "image/x-icon" : "application/javascript";
      return response(path, mime);
    },
  };
  const context = vm.createContext({ URL, Request, Response, caches,
    self: { location: { origin }, addEventListener: (name, fn) => { listeners[name] = fn; } },
    fetch: (req) => { calls.push(req); return state.fetch(req); },
  });
  vm.runInContext(`${source}\nthis.policy = { classify, cacheable, CORE_CACHE, STATIC_CACHE };`, context);
  return { ...context.policy, stores, caches, calls, state,
    async lifecycle(name) {
      let pending; listeners[name]({ waitUntil(p) { pending = p; } }); await pending;
    },
    dispatch(req) {
      let pending; listeners.fetch({ request: req, respondWith(p) { pending = p; } }); return pending;
    },
  };
}

test("only approved assets and exact public navigations are handled", () => {
  const w = worker();
  for (const path of ["/offline.html", "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"]) assert.equal(w.classify(request(path)), "core");
  for (const path of ["/_next/static/chunks/abc123.js", "/_next/static/css/abc.css", "/_next/static/media/abc.woff2"]) assert.equal(w.classify(request(path)), "static");
  assert.equal(w.classify(request("/", { navigation: true })), "navigation");
  assert.equal(w.classify(request("/")), "ignore");
  for (const path of ["/api", "/api/public", "/api/espectaculos/payments/webhook", "/login", "/auth/callback", "/mfa/verify", "/reset-password", "/perfil", "/perfil-v2", "/espectaculos/checkout/123", "/espectaculos/encomendas/123", "/espectaculos/bilhetes/123", "/espectaculos/organizador/eventos/123/checkin", "/qr", "/uploads/a.png", "/_next/image", "/unknown", "/gran-bazar/editar/123", "/_next/static/data.json", "/_next/static/index.html", "/_next/static/chunks/a.js.map", "/icons/other.png", "/sw.js", "/manifest.webmanifest", "https://stripe.com/a.js", "https://example.supabase.co/a.png", "/?token_hash=secret", "/icons/icon-192.png?client_secret=secret", "/_next/static/a.js?_rsc=1", "/_next/static/%61.js"]) {
    assert.equal(w.dispatch(request(path, { navigation: true })), undefined, path);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) assert.equal(w.classify(request("/_next/static/a.js", { method })), "ignore");
});

test("RSC, actions, authentication and prefetch headers are excluded even on assets", () => {
  const w = worker();
  for (const header of ["RSC", "Next-Router-State-Tree", "Next-Router-Prefetch", "Next-Router-Segment-Prefetch", "Next-Action", "Next-Url", "X-Nextjs-Data", "X-Middleware-Prefetch", "Purpose", "Sec-Purpose", "Authorization", "Cookie", "Range"]) {
    assert.equal(w.classify(request("/_next/static/a.js", { headers: { [header]: "0" } })), "ignore", header);
  }
  assert.equal(w.classify(request("/", { navigation: true, headers: { Accept: "text/x-component" } })), "ignore");
});

test("reject unsafe responses, wrong MIME and non-immutable Next assets", () => {
  const w = worker(), req = request("/_next/static/a.js");
  for (const headers of [{ "Cache-Control": "private" }, { "Cache-Control": "public, no-store" }, { "Cache-Control": "max-age=0" }, { "Set-Cookie": "secret=x" }, { Vary: "Cookie" }, { Vary: "*" }]) assert.equal(w.cacheable(req, response(req.url, "application/javascript", headers), "static"), false);
  for (const type of ["opaque", "opaqueredirect", "cors", "default"]) {
    const res = response(req.url); Object.defineProperty(res, "type", { value: type });
    assert.equal(w.cacheable(req, res, "static"), false);
  }
  for (const status of [201, 302, 401, 403, 404, 500]) assert.equal(w.cacheable(req, new Response("error", { status }), "static"), false);
  const redirected = response(req.url); Object.defineProperty(redirected, "redirected", { value: true });
  assert.equal(w.cacheable(req, redirected, "static"), false);
  assert.equal(w.cacheable(req, response("https://other.example/a.js"), "static"), false);
  for (const mime of ["text/html", "text/x-component", "application/json"]) assert.equal(w.cacheable(req, response(req.url, mime), "static"), false);
});

test("installation caches only six anonymous resources and activation preserves foreign caches", async () => {
  const w = worker();
  await w.lifecycle("install");
  assert.equal(w.stores.get(w.CORE_CACHE).size, 6);
  for (const req of w.calls) {
    assert.equal(req.credentials, "omit"); assert.equal(req.redirect, "error");
    assert.equal(req.referrerPolicy, "no-referrer"); assert.equal([...req.headers].length, 0);
  }
  await w.caches.open("foreign-cache"); await w.caches.open("otj-pwa-old"); await w.caches.open(w.STATIC_CACHE);
  await w.lifecycle("activate");
  assert.equal(w.stores.has("foreign-cache"), true); assert.equal(w.stores.has("otj-pwa-old"), false);
  assert.equal(w.stores.has(w.CORE_CACHE), true); assert.equal(w.stores.has(w.STATIC_CACHE), true);
  // self has no skipWaiting or clients.claim: lifecycle would fail if called.
});

test("rejected precache responses do not weaken policy or prevent installation", async () => {
  const w = worker(); w.state.fetch = async () => new Response("login", { status: 401 });
  await w.lifecycle("install");
  assert.equal(w.stores.get(w.CORE_CACHE).size, 0);
});

test("network navigation never stores HTML; fallback only on transport failure", async () => {
  const w = worker(); await w.lifecycle("install");
  const req = request("/", { navigation: true });
  w.state.fetch = async () => new Response("private HTML", { headers: { "Content-Type": "text/html" } });
  assert.equal(await (await w.dispatch(req)).text(), "private HTML");
  assert.equal(w.stores.get(w.CORE_CACHE).size, 6);
  for (const status of [401, 403, 500, 503]) {
    w.state.fetch = async () => new Response("server error", { status });
    assert.equal((await w.dispatch(req)).status, status);
  }
  w.state.fetch = async () => { throw new TypeError("offline"); };
  assert.equal(await (await w.dispatch(req)).text(), "asset");
  assert.equal(w.dispatch(request("/", { navigation: true, headers: { RSC: "1" } })), undefined);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(w.dispatch(request("/", { navigation: true, signal: controller.signal })));
});

test("cache-first assets strip response metadata and enforce size/count limits", async () => {
  const w = worker(), req = request("/_next/static/a.js");
  w.state.fetch = async (r) => response(r.url, "application/javascript", { "X-Private-Metadata": "do-not-store" });
  await w.dispatch(req); await w.dispatch(req);
  assert.equal(w.calls.length, 1);
  const stored = w.stores.get(w.STATIC_CACHE).get(req.url);
  assert.deepEqual([...stored.headers.keys()], ["cache-control", "content-type"]);
  for (let i = 0; i < 65; i++) await w.dispatch(request(`/_next/static/${i}.js`));
  assert.equal(w.stores.get(w.STATIC_CACHE).size, 64);
  w.state.fetch = async (r) => response(r.url, "application/javascript", {}, "x".repeat(2 * 1024 * 1024 + 1));
  await w.dispatch(request("/_next/static/large.js"));
  assert.equal(w.stores.get(w.STATIC_CACHE).has(`${origin}/_next/static/large.js`), false);
});

test("storage failures do not break online assets; missing fallback preserves network failure", async () => {
  const w = worker(); w.caches.open = async () => { throw new Error("storage unavailable"); };
  assert.equal((await w.dispatch(request("/_next/static/a.js"))).status, 200);
  const empty = worker(); empty.state.fetch = async () => { throw new TypeError("offline"); };
  await assert.rejects(empty.dispatch(request("/", { navigation: true })));
});
