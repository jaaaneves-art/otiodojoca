"use client";

import Link from "next/link";
import { Heart, LayoutGrid, MessageCircle, Plus, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/lup", label: "Explorar", icon: LayoutGrid, exact: true },
  { href: "/lup/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/lup/favoritos", label: "Favoritos", icon: Heart },
  { href: "/lup/meus-anuncios", label: "Os meus", icon: UserRound },
];

export default function LupNavLinks({ unreadTotal }: { unreadTotal: number }) {
  const pathname = usePathname();

  return (
    <div className="flex min-w-max items-center gap-1.5">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition sm:px-3.5 ${
              active ? "bg-white text-lup-950 shadow-sm" : "text-lup-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{label}</span>
            {href === "/lup/mensagens" && unreadTotal > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-amber-300 px-1.5 py-0.5 text-center text-[10px] font-black text-lup-950 ring-2 ring-lup-900">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </Link>
        );
      })}
      <Link href="/lup/novo" className="ml-1 inline-flex min-h-10 items-center gap-2 rounded-xl bg-lup-400 px-3.5 py-2 text-sm font-black text-lup-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-lup-300 sm:px-4">
        <Plus className="h-4 w-4" strokeWidth={3} />
        <span className="hidden sm:inline">Publicar</span>
      </Link>
    </div>
  );
}
