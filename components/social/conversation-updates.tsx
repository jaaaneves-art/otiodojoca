"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { markRead } from "@/app/mensagens/actions";

export function ConversationUpdates({ userId, id, latest }: { userId: string; id?: string; latest?: string }) {
  const router = useRouter();
  const accountActive = useRef(true);
  const [connected, setConnected] = useState(false);
  const [readError, setReadError] = useState("");

  // The subscription depends on the account, not the latest message or cursor.
  // Re-fetch Server Components under RLS; never append untrusted socket payloads.
  useEffect(() => {
    const db = createClient();
    accountActive.current = true;
    let disposed = false;
    let accountChanged = false;
    let channel: RealtimeChannel | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    const refresh = () => {
      if (disposed || accountChanged || document.visibilityState !== "visible" || refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        if (!disposed && !accountChanged && document.visibilityState === "visible") router.refresh();
      }, 200);
    };
    const connect = async () => {
      const attempt = ++generation;
      const previous = channel;
      channel = undefined;
      if (previous) await db.removeChannel(previous).catch(() => undefined);
      if (disposed || accountChanged || attempt !== generation) return;
      const current = db.channel(`social:${userId}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_realtime_state", filter: `user_id=eq.${userId}` }, refresh)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "social_realtime_state", filter: `user_id=eq.${userId}` }, refresh);
      channel = current;
      current.subscribe(status => {
        if (disposed || accountChanged || attempt !== generation) return;
        const ready = status === "SUBSCRIBED";
        setConnected(ready);
        if (ready) {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = undefined;
          refresh(); // Reconcile the initial fetch/subscription gap and reconnects.
        } else if (!retryTimer && ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          retryTimer = setTimeout(() => {
            retryTimer = undefined;
            void connect().catch(() => undefined);
          }, 5000);
        }
      });
    };
    void connect().catch(() => undefined);
    // Always retain the 15s safety net, including when Realtime reports success
    // but the publication is not yet applied or an event is lost.
    const poll = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
      if (disposed || accountChanged) return;
      if (event === "SIGNED_OUT" || (session && session.user.id !== userId)) {
        accountChanged = true;
        accountActive.current = false;
        clearInterval(poll);
        if (retryTimer) clearTimeout(retryTimer);
        ++generation;
        if (channel) void db.removeChannel(channel).catch(() => undefined);
        channel = undefined;
        setConnected(false);
        // Do not run auth queries inside the auth callback. Refresh via a task.
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => { if (!disposed) router.refresh(); }, 0);
      }
    });
    return () => {
      disposed = true;
      accountActive.current = false;
      ++generation;
      clearInterval(poll);
      if (refreshTimer) clearTimeout(refreshTimer);
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      subscription.unsubscribe();
      if (channel) void db.removeChannel(channel).catch(() => undefined);
    };
  }, [userId, router]);

  // Reading is tied to rendered recent messages, never to arriving event payloads.
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    const read = async () => {
      if (disposed || !accountActive.current || inFlight || document.visibilityState !== "visible" || !id || !latest) return;
      inFlight = true;
      try {
        const result = await markRead(id, latest);
        if (!disposed && accountActive.current) setReadError(result.error || "");
      } catch {
        if (!disposed && accountActive.current) setReadError("Não foi possível registar a leitura.");
      } finally { inFlight = false; }
    };
    void read();
    const retry = setInterval(() => { void read(); }, 15000);
    document.addEventListener("visibilitychange", read);
    window.addEventListener("online", read);
    return () => {
      disposed = true;
      clearInterval(retry);
      document.removeEventListener("visibilitychange", read);
      window.removeEventListener("online", read);
    };
  }, [id, latest, userId]);

  return <div className="text-sm text-gray-600">
    <p role="status">{connected ? "Atualização em tempo real ativa." : "Atualização automática a cada 15 segundos."}</p>
    {readError && <p role="status">{readError}</p>}
  </div>;
}
