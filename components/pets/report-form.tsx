"use client";

import { useState } from "react";
import { reportPetPost } from "@/app/mundo-dos-patudos/actions";

export function ReportForm({ id, loggedIn }: { id: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  if (!loggedIn) return <p className="text-xs text-[#657071]">Inicia sessão para denunciar informação incorreta ou insegura.</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs font-semibold text-[#657071] underline">Denunciar publicação</button>;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const result = await reportPetPost(id, new FormData(event.currentTarget)).catch(() => ({ error: "Não foi possível enviar." }));
    setMessage(result.error ?? "Denúncia enviada para análise. Obrigado."); setPending(false);
  }
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#d8cfbd] bg-white p-4">
    <label className="block text-xs font-bold">Motivo
      <select name="reason" required className="mt-1 w-full rounded-lg border p-2 font-normal">
        <option value="incorrect">Informação incorreta</option><option value="unsafe">Risco para o animal</option><option value="fraud">Possível fraude</option><option value="duplicate">Duplicado</option><option value="other">Outro</option>
      </select>
    </label>
    <textarea name="details" maxLength={1000} placeholder="Informação adicional (opcional)" className="w-full rounded-lg border p-2 text-xs" />
    <button disabled={pending} className="rounded-lg bg-[#102a32] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "A enviar…" : "Enviar denúncia"}</button>
    {message && <p role="status" className="text-xs text-[#657071]">{message}</p>}
  </form>;
}
