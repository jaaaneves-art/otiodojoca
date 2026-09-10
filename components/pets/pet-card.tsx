import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, PawPrint } from "lucide-react";
import { PET_KINDS, PET_SPECIES, type PetPost } from "@/lib/pets/types";

export function PetCard({ post, photoUrl }: { post: PetPost; photoUrl?: string }) {
  const kind = PET_KINDS[post.kind];
  return (
    <Link href={`/mundo-dos-patudos/${post.id}`} className="group overflow-hidden rounded-[1.5rem] border border-[#d8cfbd] bg-white text-[#102a32] shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#173d46]">
        {photoUrl ? (
          <Image src={photoUrl} alt={post.pet_name ? `Fotografia de ${post.pet_name}` : post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-[#8ed6b4]"><PawPrint size={58} strokeWidth={1.25} /></div>
        )}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold ${kind.color}`}>{kind.label}</span>
        {post.status === "resolved" && <span className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#245f4e]">Resolvido</span>}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#fa7b68]">{PET_SPECIES[post.species]}{post.pet_name ? ` · ${post.pet_name}` : ""}</p>
        <h3 className="mt-2 font-serif text-2xl leading-tight">{post.title}</h3>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#657071]">
          <span className="flex items-center gap-1"><MapPin size={14} />{post.freguesia?.nome ?? "Local por indicar"}</span>
          <span className="flex items-center gap-1"><Clock3 size={14} />{new Date(post.created_at).toLocaleDateString("pt-PT")}</span>
        </div>
      </div>
    </Link>
  );
}
