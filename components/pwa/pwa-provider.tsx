"use client";

import { useEffect, useState } from "react";
import { OfflineStatus } from "./offline-status";
import { InstallPrompt } from "./install-prompt";
import { UpdatePrompt } from "./update-prompt";

export function PwaProvider() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    const enabled = process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_PWA_TEST_ENABLED === "true";
    if (!enabled || !window.isSecureContext || !("serviceWorker" in navigator)) return;

    const register = () => navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).then((value) => { setRegistration(value); return value; }).catch(() => {
      // Do not log URLs, cookies or session data. The website remains usable.
      console.warn("Não foi possível ativar o suporte PWA.");
    });
    void register();
    let lastUpdate = 0;
    const update = () => {
      if (Date.now() - lastUpdate < 60_000) return;
      lastUpdate = Date.now();
      void navigator.serviceWorker.ready.then((value) => value.update().catch(() => undefined));
    };
    const visible = () => { if (document.visibilityState === "visible") update(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", update);
    update();
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", update);
    };
  }, []);

  return <><OfflineStatus /><InstallPrompt /><UpdatePrompt registration={registration} /></>;
}
