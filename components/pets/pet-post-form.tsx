"use client";

import { useState } from "react";
import { FreguesiaAutocomplete } from "@/components/entidades/freguesias/freguesia-autocomplete";
import { createPetPost } from "@/app/mundo-dos-patudos/actions";
import { PET_KINDS, PET_SEX, PET_SIZE, PET_SPECIES, type PetKind } from "@/lib/pets/types";

type Freguesia = { id: number; cod_ine: string; nome: string; municipio: string; localidade: string; email?: string; telefone?: string };

export function PetPostForm({ freguesias, submissionKey }: { freguesias: Freguesia[]; submissionKey: string }) {
  const [kind, setKind] = useState<PetKind>("adoption");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const eventAt = String(formData.get("event_at") ?? "");
      if (eventAt) formData.set("event_at", new Date(eventAt).toISOString());
      const result = await createPetPost(formData);
      if (result?.error) setError(result.error);
    } catch {
      setError("Não foi possível confirmar a publicação. Verifica os teus anúncios antes de repetir.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7 rounded-[2rem] border border-[#d8cfbd] bg-[#fffaf0] p-6 shadow-sm md:p-9">
      <input type="hidden" name="submission_key" value={submissionKey} />
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-[#102a32]">O que está a acontecer? *</legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(PET_KINDS).map(([value, info]) => (
            <button key={value} type="button" onClick={() => setKind(value as PetKind)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${kind === value ? "border-[#102a32] bg-[#102a32] text-white" : "border-[#d8cfbd] bg-white text-[#40565b] hover:border-[#8ed6b4]"}`}>
              {info.shortLabel}
            </button>
          ))}
        </div>
        <input type="hidden" name="kind" value={kind} />
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-[#102a32]">Tipo de animal *
          <select name="species" required className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal">
            {Object.entries(PET_SPECIES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#102a32]">Nome do animal
          <input name="pet_name" maxLength={80} placeholder="Se for conhecido" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
        </label>
      </div>

      <label className="block text-sm font-semibold text-[#102a32]">Título *
        <input name="title" required minLength={5} maxLength={120} placeholder="Ex.: Cadela jovem procura uma família"
          className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
      </label>

      <label className="block text-sm font-semibold text-[#102a32]">Descrição *
        <textarea name="description" required minLength={30} maxLength={5000} rows={7}
          placeholder="Descreve o animal, o seu temperamento e tudo o que possa ajudar a resolver este caso..."
          className="mt-2 w-full resize-y rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal leading-relaxed" />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="text-sm font-semibold text-[#102a32]">Sexo
          <select name="sex" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal">
            {Object.entries(PET_SEX).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#102a32]">Porte
          <select name="size" defaultValue="" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal">
            <option value="">Não indicado</option>
            {Object.entries(PET_SIZE).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#102a32]">Idade aproximada
          <input name="age_label" maxLength={60} placeholder="Ex.: cerca de 2 anos" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-[#102a32]">Raça
          <input name="breed" maxLength={100} placeholder="Ou cruzamento" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-[#102a32]">Cor e sinais particulares
          <input name="color" maxLength={100} placeholder="Ajuda a identificar" className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
        </label>
      </div>

      <FreguesiaAutocomplete freguesias={freguesias} />
      <label className="block text-sm font-semibold text-[#102a32]">Local aproximado
        <input name="location_detail" maxLength={180} placeholder="Evita indicar uma morada particular completa"
          className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
      </label>

      {(kind === "lost" || kind === "found") && (
        <label className="block text-sm font-semibold text-[#102a32]">Última vez que foi visto *
          <input name="event_at" type="datetime-local" required className="mt-2 w-full rounded-xl border border-[#d8cfbd] bg-white p-3 font-normal" />
        </label>
      )}
      {kind === "help" && (
        <label className="flex items-start gap-3 rounded-xl border border-[#fa7b68]/30 bg-[#fa7b68]/10 p-4 text-sm text-[#40565b]">
          <input name="is_urgent" type="checkbox" className="mt-1" />
          <span><strong className="block text-[#102a32]">Pedido urgente</strong>Usa apenas quando a saúde ou segurança do animal exige resposta rápida.</span>
        </label>
      )}

      <label className="block text-sm font-semibold text-[#102a32]">Fotografias
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple
          className="mt-2 block w-full rounded-xl border border-dashed border-[#8ed6b4] bg-[#8ed6b4]/10 p-5 text-sm font-normal" />
        <span className="mt-2 block text-xs font-normal text-[#657071]">Até 3 imagens JPG, PNG ou WEBP, com máximo de 4 MB cada.</span>
      </label>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending}
        className="w-full rounded-xl bg-[#102a32] px-5 py-4 font-bold text-white transition hover:bg-[#173d46] disabled:cursor-not-allowed disabled:opacity-55">
        {pending ? "A publicar…" : "Publicar no Mundo dos Patudos"}
      </button>
      <p className="text-center text-xs leading-relaxed text-[#657071]">Ao publicar, confirmas que a informação é verdadeira e que tens autorização para partilhar as fotografias.</p>
    </form>
  );
}
