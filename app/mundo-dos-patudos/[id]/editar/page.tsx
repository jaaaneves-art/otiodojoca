import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetCommunityNav } from "@/components/pets/pet-community-nav";
import { PetEditForm } from "@/components/pets/pet-edit-form";
import type { PetPost } from "@/lib/pets/types";

export default async function EditPetPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data } = await supabase.from("pet_posts").select("*,freguesia:freguesias(id,cod_ine,nome,municipio,localidade,email,telefone)").eq("id", id).eq("author_id", user.id).maybeSingle();
  if (!data) notFound();
  const post = data as unknown as PetPost & { freguesia: { id:number;cod_ine:string;nome:string;municipio:string;localidade:string|null;email:string|null;telefone:string|null } };
  const { data: all } = await supabase.from("freguesias").select("id,cod_ine,nome,municipio,localidade,email,telefone").eq("active", true).order("nome");
  const normalise = (f: typeof post.freguesia) => ({ ...f, localidade: f.localidade ?? "", email: f.email ?? undefined, telefone: f.telefone ?? undefined });
  const freguesias = (all ?? []).map((f) => normalise(f as typeof post.freguesia));
  return <><PetCommunityNav loggedIn /><main className="min-h-screen bg-[#f3ead8] px-5 py-10 text-[#102a32]"><div className="mx-auto max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#fa7b68]">Editar publicação</p><h1 className="mb-8 mt-3 font-serif text-4xl md:text-6xl">Atualizar este caso</h1><PetEditForm post={post} freguesias={freguesias} freguesia={normalise(post.freguesia)} /></div></main></>;
}
