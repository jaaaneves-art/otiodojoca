import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function evaluate(path, globals = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const evaluatedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: evaluatedModule, exports: evaluatedModule.exports, require: () => ({}), ...globals });
  return evaluatedModule.exports;
}

test("Next matcher excludes only exact PWA endpoints, independent of session/MFA", () => {
  const { config } = evaluate("proxy.ts");
  const { getMiddlewareMatchers } = require("next/dist/build/analysis/get-page-static-info");
  const { getMiddlewareRouteMatcher } = require("next/dist/shared/lib/router/utils/middleware-route-matcher");
  const match = getMiddlewareRouteMatcher(getMiddlewareMatchers(config.matcher, {}));
  for (const headers of [{}, { cookie: "sb-test-auth-token=synthetic-session" }, { cookie: "sb-test-auth-token=synthetic-mfa-pending" }]) {
    for (const path of ["/sw.js", "/offline.html", "/manifest.webmanifest"]) {
      assert.equal(match(path, { headers }, {}), false, path);
      assert.equal(match(`${path}/private`, { headers }, {}), true, path);
    }
    for (const path of ["/swXjs", "/offlineXhtml", "/perfil", "/mfa/verify", "/api/private", "/espectaculos/checkout/1"]) assert.equal(match(path, { headers }, {}), true, path);
  }
});

test("SW headers are scoped and existing Next configuration remains intact", async () => {
  const config = require("../../next.config.js");
  const headers = await config.headers();
  assert.deepEqual(headers, [{ source: "/sw.js", headers: [
    { key: "Cache-Control", value: "no-cache" },
    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  ] }]);
  assert.equal(config.experimental.serverActions.bodySizeLimit, "15mb");
  assert.equal(config.images.remotePatterns[0].hostname, "*.supabase.co");
  assert.ok(config.turbopack.root);
});

test("registration is production/test only, secure, scoped and failure tolerant", async () => {
  for (const [env, secure, supported, expected] of [
    [{ NODE_ENV: "development" }, true, true, 0],
    [{ NODE_ENV: "test" }, true, true, 0],
    [{ NODE_ENV: "development", NEXT_PUBLIC_PWA_TEST_ENABLED: "true" }, true, true, 1],
    [{ NODE_ENV: "production" }, true, true, 1],
    [{ NODE_ENV: "production" }, false, true, 0],
    [{ NODE_ENV: "production" }, true, false, 0],
  ]) {
    const calls = [], warnings = [];
    const { PwaProvider } = evaluate("components/pwa/pwa-provider.tsx", {
      require: (specifier) => specifier === "react/jsx-runtime"
        ? { jsx: () => null, jsxs: () => null }
        : specifier === "./offline-status"
          ? { OfflineStatus: () => null }
          : { useEffect: (effect) => effect(), useState: (initial) => [initial, () => {}] },
      process: { env }, window: { isSecureContext: secure, addEventListener() {}, removeEventListener() {} },
      document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
      queueMicrotask,
      navigator: supported ? { serviceWorker: { ready: Promise.resolve({ update: async () => {} }), addEventListener() {}, removeEventListener() {}, register: (...args) => {
        calls.push(args); return Promise.reject(new Error("synthetic error with private context"));
      } } } : {},
      console: { warn: (message) => warnings.push(message) },
    });
    assert.equal(PwaProvider(), null);
    await Promise.resolve();
    assert.equal(calls.length, expected);
    if (expected) {
      assert.equal(calls[0][0], "/sw.js");
      assert.equal(calls[0][1].scope, "/");
      assert.equal(calls[0][1].updateViaCache, "none");
      assert.ok(warnings.length <= 1);
    }
  }
});

test("offline document is standalone and all precache files exist", () => {
  const html = readFileSync(new URL("../../public/offline.html", import.meta.url), "utf8");
  assert.match(html, /lang="pt-PT"/); assert.match(html, /O Tio do Joca/);
  assert.match(html, /<button type="submit">Tentar novamente<\/button>/);
  assert.match(html, /<a href="\/">Voltar à página inicial<\/a>/);
  assert.doesNotMatch(html, /<script|https?:\/\/|@import|url\(/i);
  for (const path of ["favicon.ico", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"]) assert.ok(readFileSync(new URL(`../../public/${path}`, import.meta.url)).length);
});
