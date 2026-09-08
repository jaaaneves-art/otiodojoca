import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("OfflineStatus listens to both connectivity transitions and cleans up", () => {
  const source = readFileSync(new URL("../../components/pwa/offline-status.tsx", import.meta.url), "utf8");
  const listeners = new Map(), setters = [];
  const window = {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { assert.equal(listeners.get(name), fn); listeners.delete(name); },
  };
  const navigator = { onLine: true };
  const react = {
    useState(initial) { return [initial, (value) => setters.push(value)]; },
    useEffect(effect) { react.cleanup = effect(); },
  };
  const evaluatedModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: evaluatedModule, exports: evaluatedModule.exports, require: () => react, window, navigator });
  const { OfflineStatus } = evaluatedModule.exports;
  assert.equal(OfflineStatus(), null);
  assert.deepEqual([...listeners.keys()].sort(), ["offline", "online"]);
  navigator.onLine = false; listeners.get("offline")();
  navigator.onLine = true; listeners.get("online")();
  assert.deepEqual(setters, [true, false, true]);
  react.cleanup();
  assert.equal(listeners.size, 0);
});

test("OfflineStatus is a non-blocking accessible status with no retry/action side effects", () => {
  const source = readFileSync(new URL("../../components/pwa/offline-status.tsx", import.meta.url), "utf8");
  assert.match(source, /role="status"/); assert.match(source, /aria-live="polite"/);
  assert.match(source, /navigator\.onLine/); assert.match(source, /addEventListener\("offline"/);
  assert.match(source, /addEventListener\("online"/); assert.doesNotMatch(source, /fetch\(|location\.|serviceWorker\.register/);
});
