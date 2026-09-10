import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, PawPrint, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PetCommunityNav } from "@/components/pets/pet-community-nav";
import { PostControls } from "@/components/pets/post-controls";
import { ReportForm } from "@/components/pets/report-form";
import { PET_KINDS, PET_SEX, PET_SIZE, PET_SPECIES, type PetPost } from "@/lib/pets/types";

export default async function PetPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.from("pet_posts").select("*,freguesia:freguesias(nome,municipio),author:profiles(id,username,display_name,avatar_url),pet_photos(id,storage_path,sort_order)").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (error || !data) notFound();
  const post = data as unknown as PetPost;
  const photos = (post.pet_photos ?? []).sort((a,b) => a.sort_order - b.sort_order).map((photo) => ({ ...photo, url: supabase.storage.from("pet-media").getPublicUrl(photo.storage_path).data.publicUrl }));
  const isOwner = user?.id === post.author_id;
  return <><PetCommunityNav loggedIn={!!user} /><main className="min-h-screen bg-[#f3ead8] px-5 py-8 text-[#102a32]"><div className="mx-auto max-w-5xl">
    <Link href="/mundo-dos-patudos" className="text-sm font-semibold text-[#52666a]">← Voltar à comunidade</Link>
    <article className="mt-5 overflow-hidden rounded-[2rem] border border-[#d8cfbd] bg-[#fffaf0] shadow-sm">
      {photos.length ? <div className={`grid ${photos.length > 1 ? "md:grid-cols-2" : ""}`}>{photos.map((photo, index) => <div key={photo.id} className="relative aspect-[4/3] bg-[#173d46]"><Image src={photo.url} alt={`${post.title} — fotografia ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>)}</div> : <div className="grid aspect-[16/7] place-items-center bg-[#173d46] text-[#8ed6b4]"><PawPrint size={72} strokeWidth={1.2} /></div>}
      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${PET_KINDS[post.kind].color}`}>{PET_KINDS[post.kind].label}</span>{post.is_urgent && <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white">Urgente</span>}{post.status === "resolved" && <span className="rounded-full bg-[#8ed6b4] px-3 py-1 text-xs font-extrabold">Resolvido</span>}</div>
        <h1 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">{post.title}</h1>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#657071]"><span className="flex items-center gap-1.5"><MapPin size={17} />{post.freguesia?.nome}, {post.freguesia?.municipio}</span><span className="flex items-center gap-1.5"><CalendarDays size={17} />Publicado em {new Date(post.published_at ?? post.created_at).toLocaleDateString("pt-PT")}</span></div>
        <div className="mt-8 grid gap-8 border-t border-[#d8cfbd] pt-8 md:grid-cols-[1fr_16rem]">
          <div><h2 className="font-serif text-2xl">Sobre este caso</h2><p className="mt-4 whitespace-pre-wrap leading-8 text-[#40565b]">{post.description}</p></div>
          <dl className="space-y-3 rounded-2xl bg-white p-5 text-sm"><div><dt className="text-xs text-[#7a8584]">Animal</dt><dd className="font-bold">{PET_SPECIES[post.species]}{post.pet_name ? ` · ${post.pet_name}` : ""}</dd></div><div><dt className="text-xs text-[#7a8584]">Sexo e porte</dt><dd className="font-bold">{PET_SEX[post.sex]}{post.size ? ` · ${PET_SIZE[post.size]}` : ""}</dd></div>{post.age_label && <div><dt className="text-xs text-[#7a8584]">Idade</dt><dd className="font-bold">{post.age_label}</dd></div>}{post.breed && <div><dt className="text-xs text-[#7a8584]">Raça</dt><dd className="font-bold">{post.breed}</dd></div>}{post.color && <div><dt className="text-xs text-[#7a8584]">Identificação</dt><dd className="font-bold">{post.color}</dd></div>}{post.location_detail && <div><dt className="text-xs text-[#7a8584]">Local aproximado</dt><dd className="font-bold">{post.location_detail}</dd></div>}</dl>
        </div>
        {post.author && <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-[#d8cfbd] bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#8ed6b4]/30"><UserRound size={21} /></span><div><p className="text-xs text-[#657071]">Publicado por</p><p className="font-bold">{post.author.display_name || `@${post.author.username}`}</p></div></div><Link href={`/perfil/${post.author.id}`} className="text-sm font-bold underline">Ver perfil</Link></div>}
      </div>
    </article>
    <div className="mt-5 grid gap-5 md:grid-cols-2">{isOwner ? <PostControls id={post.id} status={post.status} /> : <div />}<div className="md:justify-self-end"><ReportForm id={post.id} loggedIn={!!user} /></div></div>
  </div></main></>;
}
