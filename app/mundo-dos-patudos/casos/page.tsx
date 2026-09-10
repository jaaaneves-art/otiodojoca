import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PetCommunityNav } from "@/components/pets/pet-community-nav";
import { PetCard } from "@/components/pets/pet-card";
import { PET_KINDS, PET_SPECIES, type PetPost } from "@/lib/pets/types";

export const metadata: Metadata = { title: "Casos da comunidade | Mundo dos Patudos" };

type Params = { q?: string; kind?: string; species?: string; state?: string };

export default async function PetCasesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("pet_posts").select("*,freguesia:freguesias(nome,municipio),pet_photos(id,storage_path,sort_order)").in("status", params.state === "resolved" ? ["resolved"] : ["published"]);
  if (params.kind && params.kind in PET_KINDS) query = query.eq("kind", params.kind);
  if (params.species && params.species in PET_SPECIES) query = query.eq("species", params.species);
  const safeQ = String(params.q ?? "").trim().replace(/[%_,().]/g, "").slice(0, 80);
  if (safeQ) query = query.ilike("title", `%${safeQ}%`);
  const { data } = await query.order("is_urgent", { ascending: false }).order("created_at", { ascending: false }).limit(60);
  const posts = (data ?? []) as unknown as PetPost[];
  return <><PetCommunityNav loggedIn={!!user} /><main className="min-h-screen bg-[#f3ead8] px-5 py-9 text-[#102a32]"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#fa7b68]">Mundo dos Patudos</p><h1 className="mt-2 font-serif text-4xl md:text-6xl">Casos da comunidade</h1></div><Link href={user ? "/mundo-dos-patudos/publicar" : "/login"} className="rounded-xl bg-[#8ed6b4] px-4 py-3 text-sm font-bold">Criar publicação</Link></div>
    <form className="mt-8 grid gap-3 rounded-2xl border border-[#d8cfbd] bg-[#fffaf0] p-4 md:grid-cols-[1fr_auto_auto_auto]">
      <label className="relative"><span className="sr-only">Pesquisar</span><Search className="absolute left-3 top-3 text-[#7b8989]" size={18} /><input name="q" defaultValue={safeQ} placeholder="Pesquisar pelo título…" className="w-full rounded-xl border border-[#d8cfbd] bg-white py-2.5 pl-10 pr-3" /></label>
      <select name="kind" defaultValue={params.kind ?? ""} className="rounded-xl border border-[#d8cfbd] bg-white px-3 py-2.5"><option value="">Todos os casos</option>{Object.entries(PET_KINDS).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select>
      <select name="species" defaultValue={params.species ?? ""} className="rounded-xl border border-[#d8cfbd] bg-white px-3 py-2.5"><option value="">Todos os animais</option>{Object.entries(PET_SPECIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button className="rounded-xl bg-[#102a32] px-5 py-2.5 font-bold text-white">Procurar</button>
    </form>
    <div className="mt-5 flex gap-4 text-sm"><Link className={!params.state ? "font-bold underline" : ""} href="/mundo-dos-patudos/casos">Ativos</Link><Link className={params.state === "resolved" ? "font-bold underline" : ""} href="/mundo-dos-patudos/casos?state=resolved">Resolvidos</Link></div>
    {posts.length ? <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => { const photo = post.pet_photos?.[0]; const url = photo ? supabase.storage.from("pet-media").getPublicUrl(photo.storage_path).data.publicUrl : undefined; return <PetCard key={post.id} post={post} photoUrl={url} />; })}</div> : <div className="mt-7 rounded-2xl border border-dashed border-[#cfc4ae] bg-white/50 p-12 text-center text-[#657071]">Não encontrámos publicações com estes filtros.</div>}
  </div></main></>;
}
