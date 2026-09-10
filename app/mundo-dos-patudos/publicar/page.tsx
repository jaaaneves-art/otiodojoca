import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetCommunityNav } from "@/components/pets/pet-community-nav";
import { PetPostForm } from "@/components/pets/pet-post-form";

export const metadata: Metadata = { title: "Publicar | Mundo dos Patudos" };

export default async function PublishPetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("freguesias").select("id,cod_ine,nome,municipio,localidade,email,telefone").eq("active", true).order("nome");
  const freguesias = (data ?? []).map((item) => ({ ...item, localidade: item.localidade ?? "", email: item.email ?? undefined, telefone: item.telefone ?? undefined }));
  return <>
    <PetCommunityNav loggedIn />
    <main className="min-h-screen bg-[#f3ead8] px-5 py-10 text-[#102a32]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#fa7b68]">Nova publicação</p>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl">Conta-nos como podemos ajudar.</h1>
        <p className="mb-8 mt-4 max-w-2xl leading-relaxed text-[#657071]">A informação será pública. Não indiques uma morada privada completa nem dados pessoais desnecessários.</p>
        <PetPostForm freguesias={freguesias} submissionKey={randomUUID()} />
      </div>
    </main>
  </>;
}
