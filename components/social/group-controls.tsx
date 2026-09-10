"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeMemberRole, createGroup, deleteGroupMessage, inviteMember,
  leaveGroup, removeMember, respondInvite, sendGroupMessage, transferOwnership,
} from "@/app/grupos/actions";

export function GroupForm() {
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
      const result = await createGroup(new FormData(form));
      if (result.error) setError(result.error);
      else if (result.id) router.push(`/grupos/${result.id}`);
    } catch { setError("Não foi possível criar o grupo. Tenta novamente."); }
    finally { busy.current = false; setPending(false); }
  }}>
    <label className="block">Nome do grupo<input name="name" required maxLength={120} className="block w-full rounded border p-2" /></label>
    <label className="block">Descrição (opcional)<textarea name="description" maxLength={2000} rows={2} className="block w-full rounded border p-2" /></label>
    <label className="block">URL de imagem (opcional)<input name="image_url" type="url" className="block w-full rounded border p-2" /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={pending} className="rounded bg-green-800 px-4 py-2 text-white disabled:opacity-50">{pending ? "A criar…" : "Criar grupo"}</button>
  </form>;
}

export function InviteForm({ groupId }: { groupId: string }) {
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
      const result = await inviteMember(groupId, new FormData(form));
      if (result.error) setError(result.error);
      else { form.reset(); router.refresh(); }
    } catch { setError("Não foi possível convidar. Tenta novamente."); }
    finally { busy.current = false; setPending(false); }
  }}>
    <label className="block">Nome de utilizador<input name="username" required maxLength={80} placeholder="@nome" className="block w-full rounded border p-2" /></label>
    <label className="block">Papel<select name="role" defaultValue="member" className="block w-full rounded border p-2">
      <option value="member">Membro</option>
      <option value="moderator">Moderador</option>
      <option value="admin">Admin</option>
    </select></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={pending} className="rounded bg-green-800 px-4 py-2 text-white disabled:opacity-50">{pending ? "A convidar…" : "Convidar"}</button>
  </form>;
}

export function InviteResponse({ inviteId, groupId }: { inviteId: string; groupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const respond = async (accept: boolean) => {
    setPending(true); setError("");
    try {
      const result = await respondInvite(inviteId, groupId, accept);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch { setError("Não foi possível responder. Tenta novamente."); }
    finally { setPending(false); }
  };
  return <div className="space-y-2">
    <div className="flex gap-3">
      <button disabled={pending} onClick={() => respond(true)} className="rounded bg-green-800 px-4 py-2 text-white disabled:opacity-50">Aceitar</button>
      <button disabled={pending} onClick={() => respond(false)} className="rounded border px-4 py-2 disabled:opacity-50">Recusar</button>
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <>
    <button className="text-sm underline" disabled={pending} onClick={async () => {
      setPending(true); setError("");
      try {
        const result = await leaveGroup(groupId);
        if (result.error) setError(result.error);
        else router.push("/grupos");
      } catch { setError("Não foi possível sair do grupo."); }
      finally { setPending(false); }
    }}>{pending ? "A sair…" : "Sair do grupo"}</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </>;
}

export function MemberActions({ groupId, userId, role }: { groupId: string; userId: string; role: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className="flex items-center gap-2">
    <select defaultValue={role} disabled={pending} className="rounded border p-1 text-sm" onChange={async event => {
      setPending(true); setError("");
      try {
        const result = await changeMemberRole(groupId, userId, event.currentTarget.value);
        if (result.error) setError(result.error);
        else router.refresh();
      } catch { setError("Não foi possível alterar o papel."); }
      finally { setPending(false); }
    }}>
      <option value="member">Membro</option>
      <option value="moderator">Moderador</option>
      <option value="admin">Admin</option>
    </select>
    <button disabled={pending} className="text-sm text-red-700 underline disabled:opacity-50" onClick={async () => {
      setPending(true); setError("");
      try {
        const result = await removeMember(groupId, userId);
        if (result.error) setError(result.error);
        else router.refresh();
      } catch { setError("Não foi possível remover este membro."); }
      finally { setPending(false); }
    }}>Remover</button>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
  </div>;
}

export function TransferOwnershipForm({ groupId, members }: { groupId: string; members: { userId: string; label: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!members.length) return null;
  return <form className="space-y-2" onSubmit={async event => {
    event.preventDefault();
    setPending(true); setError("");
    try {
      const newOwnerId = String(new FormData(event.currentTarget).get("new_owner") || "");
      const result = await transferOwnership(groupId, newOwnerId);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch { setError("Não foi possível transferir a propriedade."); }
    finally { setPending(false); }
  }}>
    <label className="block text-sm">Transferir propriedade para
      <select name="new_owner" required disabled={pending} className="block w-full rounded border p-2">
        <option value="">Escolhe um membro</option>
        {members.map(m => <option key={m.userId} value={m.userId}>{m.label}</option>)}
      </select>
    </label>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    <button disabled={pending} className="rounded border px-3 py-1 text-sm disabled:opacity-50">{pending ? "A transferir…" : "Transferir"}</button>
  </form>;
}

export function GroupMessageForm({ groupId }: { groupId: string }) {
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
      const result = await sendGroupMessage(groupId, new FormData(form));
      if (result.error) setError(result.error);
      else { form.reset(); router.refresh(); }
    } catch { setError("Não foi possível concluir. Verifica a ligação e tenta novamente."); }
    finally { busy.current = false; setPending(false); }
  }}>
    <label className="block">Mensagem<textarea name="content" maxLength={5000} rows={3} className="block w-full rounded border p-2" /></label>
    <label className="block">Anexo (até 5 MB)<input className="block w-full" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4" /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={pending} className="rounded bg-green-800 px-4 py-2 text-white disabled:opacity-50">{pending ? "A processar…" : "Enviar"}</button>
  </form>;
}

export function DeleteGroupMessage({ groupId, messageId }: { groupId: string; messageId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <><button className="text-sm underline" disabled={pending} onClick={async () => {
    setPending(true); setError("");
    try { const result = await deleteGroupMessage(groupId, messageId); if (result.error) setError(result.error); }
    catch { setError("Não foi possível apagar. Tenta novamente."); }
    finally { setPending(false); }
  }}>{pending ? "A apagar…" : "Apagar mensagem"}</button>{error && <p role="alert">{error}</p>}</>;
}
