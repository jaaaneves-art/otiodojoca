"use client";

import { useState } from "react";
import { FreguesiaAutocomplete } from "@/components/entidades/freguesias/freguesia-autocomplete";
import { updatePetPost } from "@/app/mundo-dos-patudos/actions";
import { PET_KINDS, PET_SEX, PET_SIZE, PET_SPECIES, type PetKind, type PetPost } from "@/lib/pets/types";

type Freguesia = { id: number; cod_ine: string; nome: string; municipio: string; localidade: string; email?: string; telefone?: string };

function localDate(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso); const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PetEditForm({ post, freguesias, freguesia }: { post: PetPost; freguesias: Freguesia[]; freguesia: Freguesia }) {
  const [kind, setKind] = useState<PetKind>(post.kind);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return; setPending(true); setError("");
    const form = new FormData(event.currentTarget); const eventAt = String(form.get("event_at") ?? "");
    if (eventAt) form.set("event_at", new Date(eventAt).toISOString());
    const result = await updatePetPost(post.id, form).catch(() => ({ error: "Não foi possível confirmar as alterações." }));
    setError(result?.error ?? ""); setPending(false);
  }
  const input = "mt-1 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal";
  return <form onSubmit={submit} className="space-y-6 rounded-[2rem] border border-[#d8cfbd] bg-[#fffaf0] p-6 md:p-9">
    <fieldset><legend className="mb-2 text-sm font-bold">Tipo de caso</legend><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{Object.entries(PET_KINDS).map(([value,info]) => <button key={value} type="button" onClick={() => setKind(value as PetKind)} className={`rounded-xl border p-3 text-sm font-bold ${kind===value?"bg-[#102a32] text-white":"bg-white"}`}>{info.shortLabel}</button>)}</div><input type="hidden" name="kind" value={kind} /></fieldset>
    <label className="block text-sm font-semibold">Título *<input className={input} name="title" required minLength={5} maxLength={120} defaultValue={post.title} /></label>
    <label className="block text-sm font-semibold">Descrição *<textarea className={input} name="description" required minLength={30} maxLength={5000} rows={7} defaultValue={post.description} /></label>
    <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Tipo de animal<select className={input} name="species" defaultValue={post.species}>{Object.entries(PET_SPECIES).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-sm font-semibold">Nome<input className={input} name="pet_name" maxLength={80} defaultValue={post.pet_name ?? ""} /></label></div>
    <div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-semibold">Sexo<select className={input} name="sex" defaultValue={post.sex}>{Object.entries(PET_SEX).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-sm font-semibold">Porte<select className={input} name="size" defaultValue={post.size ?? ""}><option value="">Não indicado</option>{Object.entries(PET_SIZE).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-sm font-semibold">Idade<input className={input} name="age_label" maxLength={60} defaultValue={post.age_label ?? ""} /></label></div>
    <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Raça<input className={input} name="breed" maxLength={100} defaultValue={post.breed ?? ""} /></label><label className="text-sm font-semibold">Cor/sinais<input className={input} name="color" maxLength={100} defaultValue={post.color ?? ""} /></label></div>
    <FreguesiaAutocomplete freguesias={freguesias} freguesiaInicial={freguesia} />
    <label className="block text-sm font-semibold">Local aproximado<input className={input} name="location_detail" maxLength={180} defaultValue={post.location_detail ?? ""} /></label>
    {(kind === "lost" || kind === "found") && <label className="block text-sm font-semibold">Última vez que foi visto *<input className={input} name="event_at" type="datetime-local" required defaultValue={localDate(post.event_at)} /></label>}
    {kind === "help" && <label className="flex gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" name="is_urgent" defaultChecked={post.is_urgent} /><span><strong>Pedido urgente</strong><br />Usa apenas quando existe risco imediato.</span></label>}
    <p className="rounded-xl bg-[#f4c95d]/20 p-4 text-sm text-[#52666a]">A gestão e substituição individual das fotografias será acrescentada depois dos testes de Storage. As fotografias atuais permanecem intactas.</p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <button disabled={pending} className="w-full rounded-xl bg-[#102a32] p-4 font-bold text-white disabled:opacity-50">{pending?"A guardar…":"Guardar alterações"}</button>
  </form>;
}
