"use client";

import { useState } from "react";
import { setPetPostStatus } from "@/app/mundo-dos-patudos/actions";
import type { PetPostStatus } from "@/lib/pets/types";

export function PostControls({ id, status }: { id: string; status: PetPostStatus }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function update(next: PetPostStatus) {
    if (pending) return;
    setPending(true); setError("");
    const result = await setPetPostStatus(id, next).catch(() => ({ error: "Não foi possível confirmar a alteração." }));
    setError(result.error ?? ""); setPending(false);
  }
  return <div className="rounded-2xl border border-[#d8cfbd] bg-white p-5">
    <h2 className="font-serif text-xl">Gerir publicação</h2>
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== "resolved" && <button disabled={pending} onClick={() => update("resolved")} className="rounded-lg bg-[#8ed6b4] px-4 py-2 text-sm font-bold text-[#102a32] disabled:opacity-50">Marcar como resolvido</button>}
      {status === "resolved" && <button disabled={pending} onClick={() => update("published")} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50">Reabrir</button>}
      {status !== "archived" && <button disabled={pending} onClick={() => update("archived")} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50">Arquivar</button>}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
