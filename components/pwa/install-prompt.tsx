"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<{ outcome: "accepted" | "dismissed" }> };

function standalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIosSafari() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [isStandalone, setStandalone] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(standalone());
    const capture = (value: Event) => { value.preventDefault(); setEvent(value as InstallEvent); };
    const installed = () => { setEvent(null); setStandalone(true); };
    update();
    queueMicrotask(() => setIosSafari(isIosSafari()));
    media.addEventListener?.("change", update);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      media.removeEventListener?.("change", update);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!event || isStandalone || dismissed) return;
    const result = await event.prompt();
    setEvent(null);
    setDismissed(true);
    if (result.outcome === "accepted") setStandalone(standalone());
    if (result.outcome === "dismissed") setDismissed(true);
  }

  if (isStandalone || dismissed) return null;
  if (event) return <button type="button" onClick={() => void install()} className="fixed bottom-4 left-4 z-40 rounded bg-terra-800 px-4 py-2 text-sm text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Instalar aplicação</button>;
  if (iosSafari) return <p role="status" aria-live="polite" className="mx-auto max-w-md px-4 py-2 text-center text-sm text-terra-700">Para instalar: no Safari, toca em Partilhar e depois em “Adicionar ao ecrã principal”.</p>;
  return null;
}
