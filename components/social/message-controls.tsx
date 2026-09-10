"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage, sendMessage, startConversation } from "@/app/mensagens/actions";

export function MessageForm({ conversationId, initialUsername = "" }: { conversationId?: string; initialUsername?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  return <form className="space-y-3 rounded-xl border p-4" onSubmit={async event => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const form = event.currentTarget;
    setPending(true); setError("");
    try {
      const result = conversationId ? await sendMessage(conversationId, new FormData(form)) : await startConversation(new FormData(form));
      if (result.error) setError(result.error);
      else if ("id" in result && result.id) router.push(`/mensagens/${result.id}`);
      else { form.reset(); router.refresh(); }
    } catch { setError("Não foi possível concluir. Verifica a ligação e tenta novamente."); }
    finally { busy.current = false; setPending(false); }
  }}>
    {conversationId ? <>
      <label className="block">Mensagem<textarea name="content" maxLength={5000} rows={3} className="block w-full rounded border p-2" /></label>
      <label className="block">Anexo (até 5 MB)<input className="block w-full" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4" /></label>
    </> : <label className="block">Nome de utilizador<input name="username" required maxLength={80} defaultValue={initialUsername} placeholder="@nome" className="block w-full rounded border p-2" /></label>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={pending} className="rounded bg-green-800 px-4 py-2 text-white disabled:opacity-50">{pending ? "A processar…" : conversationId ? "Enviar" : "Iniciar conversa"}</button>
  </form>;
}

export function DeleteMessage({ conversationId, messageId }: { conversationId: string; messageId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <><button className="text-sm underline" disabled={pending} onClick={async () => {
    setPending(true); setError("");
    try { const result = await deleteMessage(conversationId, messageId); if (result.error) setError(result.error); }
    catch { setError("Não foi possível apagar. Tenta novamente."); }
    finally { setPending(false); }
  }}>{pending ? "A apagar…" : "Apagar mensagem"}</button>{error && <p role="alert">{error}</p>}</>;
}
