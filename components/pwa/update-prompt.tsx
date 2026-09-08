"use client";

import { useEffect, useState } from "react";

const SENSITIVE = /^(\/login|\/registo|\/forgot-password|\/reset-password|\/mfa|\/perfil|\/espectaculos\/(checkout|encomendas|bilhetes|organizador)|\/api)(\/|$)/;

function canReload() {
  if (SENSITIVE.test(window.location.pathname)) return false;
  return !Array.from(document.querySelectorAll("input, textarea, select")).some((field) => {
    const element = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    return element.value !== ("defaultValue" in element ? element.defaultValue : element.value);
  });
}

export function UpdatePrompt({ registration }: { registration: ServiceWorkerRegistration | null }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!registration) return;
    const update = () => setWaiting(registration.waiting);
    const found = () => {
      update();
      registration.installing?.addEventListener("statechange", update);
    };
    const waitingWorker = registration.waiting;
    update();
    registration.addEventListener("updatefound", found);
    waitingWorker?.addEventListener("statechange", update);
    return () => {
      registration.removeEventListener("updatefound", found);
      waitingWorker?.removeEventListener("statechange", update);
      registration.installing?.removeEventListener("statechange", update);
    };
  }, [registration]);

  async function activate() {
    const worker = waiting;
    if (!worker || activated) return;
    setActivated(true);
    const reload = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reload);
      if (!canReload()) return;
      try {
        if (sessionStorage.getItem("otj-pwa-reloaded") === "1") return;
        sessionStorage.setItem("otj-pwa-reloaded", "1");
        window.location.reload();
      } catch { /* Storage may be unavailable; never block the current page. */ }
    };
    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    worker.postMessage({ type: "SKIP_WAITING" });
  }

  if (!waiting) return null;
  return <div role="status" aria-live="polite" aria-atomic="true" className="fixed inset-x-4 bottom-16 z-40 mx-auto flex max-w-lg items-center justify-between gap-3 rounded border border-terra-300 bg-white p-3 text-sm text-terra-900 shadow-lg"><span>Nova versão disponível</span><button type="button" disabled={activated} onClick={() => void activate()} className="rounded bg-terra-800 px-3 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{activated ? "A preparar…" : "Atualizar"}</button></div>;
}
