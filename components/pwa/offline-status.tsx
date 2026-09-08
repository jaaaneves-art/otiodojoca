"use client";

import { useEffect, useState } from "react";

/** A browser hint only: a successful request is still the source of truth. */
export function OfflineStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);

  if (online !== false) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950 shadow-lg"
    >
      Sem ligação. As operações da conta precisam de ligação ao servidor.
    </div>
  );
}
