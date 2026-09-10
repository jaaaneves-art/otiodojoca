import Link from "next/link";
import { ArrowLeft, PawPrint, Plus } from "lucide-react";

export function PetCommunityNav({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <nav className="border-b border-[#d8cfbd] bg-[#fff8e9] px-5 py-4 text-[#102a32]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/mundo-dos-patudos" className="flex items-center gap-2 font-serif text-lg"><PawPrint className="text-[#fa7b68]" size={21} />Mundo dos Patudos</Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {loggedIn && <Link href="/mundo-dos-patudos/meus-anuncios" className="hidden rounded-lg px-3 py-2 hover:bg-[#8ed6b4]/20 sm:block">Os meus casos</Link>}
          <Link href={loggedIn ? "/mundo-dos-patudos/publicar" : "/login"} className="flex items-center gap-1.5 rounded-lg bg-[#102a32] px-3 py-2 text-white"><Plus size={16} />Publicar</Link>
          <Link href="/" aria-label="Voltar à entrada" className="rounded-lg p-2 hover:bg-[#8ed6b4]/20"><ArrowLeft size={18} /></Link>
        </div>
      </div>
    </nav>
  );
}
