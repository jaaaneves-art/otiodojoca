import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetCommunityNav } from "@/components/pets/pet-community-nav";
import { PetCard } from "@/components/pets/pet-card";
import type { PetPost } from "@/lib/pets/types";

export const metadata: Metadata = { title: "Os meus casos | Mundo dos Patudos" };

export default async function MyPetPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("pet_posts").select("*,freguesia:freguesias(nome,municipio),pet_photos(id,storage_path,sort_order)").eq("author_id", user.id).order("created_at", { ascending: false });
  const posts = (data ?? []) as unknown as PetPost[];
  return <><PetCommunityNav loggedIn /><main className="min-h-screen bg-[#f3ead8] px-5 py-10 text-[#102a32]"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#fa7b68]">Área pessoal</p><h1 className="mt-3 font-serif text-4xl md:text-6xl">Os meus casos</h1>
    {posts.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => { const photo = post.pet_photos?.[0]; const url = photo ? supabase.storage.from("pet-media").getPublicUrl(photo.storage_path).data.publicUrl : undefined; return <PetCard key={post.id} post={post} photoUrl={url} />; })}</div> : <p className="mt-8 rounded-2xl border border-dashed border-[#cfc4ae] bg-white/50 p-10 text-center text-[#657071]">Ainda não criaste nenhuma publicação.</p>}
  </div></main></>;
}
