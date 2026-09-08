import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const install = readFileSync(new URL("../../components/pwa/install-prompt.tsx", import.meta.url), "utf8");
const update = readFileSync(new URL("../../components/pwa/update-prompt.tsx", import.meta.url), "utf8");
const provider = readFileSync(new URL("../../components/pwa/pwa-provider.tsx", import.meta.url), "utf8");
const worker = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

test("installation is event-driven, standalone-aware and iOS Safari guidance is conditional", () => {
  assert.match(install, /beforeinstallprompt/); assert.match(install, /preventDefault/); assert.match(install, /event\.prompt\(\)/);
  assert.match(install, /outcome === "accepted"/); assert.match(install, /outcome === "dismissed"/);
  assert.match(install, /appinstalled/); assert.match(install, /display-mode: standalone/); assert.match(install, /standalone\?: boolean/);
  assert.match(install, /iPad\|iPhone\|iPod/); assert.match(install, /CriOS\|FxiOS\|EdgiOS\|OPiOS/);
  assert.match(install, /Adicionar ao ecrã principal/); assert.match(install, /Instalar aplicação/);
  assert.match(install, /setDismissed\(true\)/); assert.doesNotMatch(install, /window\.location\.reload/);
});

test("update prompt only acts on explicit click, protects sensitive/dirty pages and limits reload", () => {
  assert.match(update, /Nova versão disponível/); assert.match(update, /Atualizar/); assert.match(update, /postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(update, /controllerchange/); assert.match(update, /sessionStorage\.getItem\("otj-pwa-reloaded"\)/); assert.match(update, /window\.location\.reload\(\)/);
  assert.match(update, /const SENSITIVE/); assert.match(update, /checkout\|encomendas\|bilhetes\|organizador/); assert.match(update, /defaultValue/);
  assert.match(update, /useEffect/);
});

test("provider throttles update checks and has no automatic activation/reload", () => {
  assert.match(provider, /value\.update\(\)/); assert.match(provider, /60_000/); assert.match(provider, /visibilitychange/); assert.match(provider, /online/);
  assert.doesNotMatch(provider, /skipWaiting|location\.reload/); assert.match(worker, /event\.data\?\.type === "SKIP_WAITING"/); assert.match(worker, /self\.skipWaiting\(\)/);
  assert.equal((worker.match(/SKIP_WAITING/g) || []).length, 1);
  assert.doesNotMatch(worker, /addEventListener\("message"[\s\S]{0,300}fetch\(/);
});

test("sensitive flows are never automatically submitted or reloaded", () => {
  for (const source of [install, update, provider]) {
    assert.doesNotMatch(source, /fetch\(/); assert.doesNotMatch(source, /submit\(/);
  }
  assert.match(update, /!canReload\(\)/); assert.match(update, /disabled=\{activated\}/);
});
